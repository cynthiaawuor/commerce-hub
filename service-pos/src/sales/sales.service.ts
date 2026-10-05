import { config } from "../core/config";
import type { CurrentUser } from "../core/current-user";
import { isUniqueViolation } from "../core/db-errors";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import type { ItemSoldPayload } from "../events/event-types";
import * as inventoryClient from "../inventory/inventory.client";
import * as priceRepository from "../prices/prices.repository";
import { settlePayments, type Tender } from "./checkout-rules";
import { AddProductDto, OpenSaleDto, PaySaleDto, TenderDto } from "./dtos/sale.dtos";
import * as saleRepository from "./sales.repository";

const NUMBER_ATTEMPTS = 5;

const formatNumber = (sequence: number) => `SALE-${String(sequence).padStart(6, "0")}`;

const getSale = async (id: string) => {
  const sale = await saleRepository.findById(id);

  if (!sale) {
    throw new NotFoundError(`Sale ${id} not found`);
  }

  return sale;
};

const getOpenSale = async (id: string) => {
  const sale = await getSale(id);

  if (sale.status !== "OPEN") {
    throw new ConflictError(`${sale.saleNumber} is ${sale.status.toLowerCase()}`);
  }

  return sale;
};

// A cashier starts serving a customer
const openSale = async (body: unknown, user: CurrentUser) => {
  const { obj, errors } = await parseAndValidate(OpenSaleDto, body);

  if (errors) {
    throw new BadRequestError("Invalid sale", errors);
  }

  // Numbered from the count. Two tills opening a sale at the same moment can land on
  // the same number, so retry when the unique index rejects it.
  for (let attempt = 0; attempt < NUMBER_ATTEMPTS; attempt += 1) {
    const sequence = (await saleRepository.count()) + 1 + attempt;

    try {
      const sale = await saleRepository.insert({
        saleNumber: formatNumber(sequence),
        storeCode: config.storeLocationCode,
        registerCode: obj!.registerCode,
        cashierId: user.id,
      });

      return getSale(sale.id);
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }
    }
  }

  throw new ConflictError("Could not allocate a sale number. Please try again.");
};

// A product is scanned. Inventory holds the stock at once, so no other channel can
// sell the same units while this customer pays.
const addProduct = async (saleId: string, body: unknown) => {
  const { obj, errors } = await parseAndValidate(AddProductDto, body);

  if (errors) {
    throw new BadRequestError("Invalid product", errors);
  }

  const sale = await getOpenSale(saleId);
  const price = await priceRepository.findBySku(obj!.sku);

  if (!price) {
    throw new NotFoundError(`No price is set for ${obj!.sku}`);
  }

  // Throws Inventory's own 409 ("Only 2 available at this location") when short
  const reservation = await inventoryClient.reserve(
    price.productId,
    obj!.quantity,
    sale.saleNumber,
  );

  try {
    await saleRepository.addProduct(
      sale.id,
      {
        productId: price.productId,
        sku: price.sku,
        productName: price.productName,
        quantity: obj!.quantity,
        unitPriceCents: price.priceCents,
        totalCents: price.priceCents * obj!.quantity,
        reservationId: reservation.id,
      },
      config.vatRatePercent,
    );
  } catch (err) {
    // Not recorded here, so give the stock back rather than hold it until it expires
    await inventoryClient.release(reservation.id).catch(() => undefined);
    throw err;
  }

  return getSale(sale.id);
};

// Gives the stock back to Inventory. A hold that already ran out or was resolved is
// fine to skip: either way nothing is held any more. Inventory being down is not.
const releaseQuietly = async (reservationId: string) => {
  try {
    await inventoryClient.release(reservationId);
  } catch (err) {
    if (!(err instanceof ConflictError) && !(err instanceof NotFoundError)) {
      throw err;
    }
  }
};

// The customer changed their mind about one product
const removeProduct = async (saleId: string, saleProductId: string) => {
  const sale = await getOpenSale(saleId);
  const product = sale.products.find((p) => p.id === saleProductId);

  if (!product) {
    throw new NotFoundError(`Product ${saleProductId} is not on ${sale.saleNumber}`);
  }

  if (product.committedAt) {
    throw new ConflictError(`${product.productName} has already left stock; finish the payment`);
  }

  await releaseQuietly(product.reservationId);
  await saleRepository.removeProduct(sale.id, product.id, config.vatRatePercent);

  return getSale(sale.id);
};

// Validates each payment on its own, so the cashier sees exactly which entry is wrong
const parseTenders = async (payments: unknown[]) => {
  const tenders: Tender[] = [];
  const errors: Record<string, string[]> = {};

  for (const [index, payment] of payments.entries()) {
    const result = await parseAndValidate(TenderDto, payment);

    if (result.errors) {
      for (const [field, messages] of Object.entries(result.errors)) {
        errors[`payments[${index}].${field}`] = messages;
      }
      continue;
    }

    tenders.push({ method: result.obj!.method, amountCents: result.obj!.amountCents });
  }

  if (Object.keys(errors).length > 0) {
    throw new BadRequestError("Invalid payment", errors);
  }

  return tenders;
};

// The customer pays: Inventory takes the stock, the sale is recorded and ItemSold goes out
const paySale = async (saleId: string, body: unknown) => {
  const { obj, errors } = await parseAndValidate(PaySaleDto, body);

  if (errors) {
    throw new BadRequestError("Invalid payment", errors);
  }

  const tenders = await parseTenders(obj!.payments);
  const sale = await getOpenSale(saleId);

  if (sale.products.length === 0) {
    throw new ConflictError("Scan at least one product before taking payment");
  }

  const settlement = settlePayments(sale.totalCents, tenders);

  if (!settlement.ok) {
    throw new BadRequestError(settlement.reason);
  }

  // Each product is marked as soon as Inventory takes it, so if one fails part-way the
  // cashier can fix it and pay again without the others being sold twice.
  for (const product of sale.products) {
    if (product.committedAt) {
      continue;
    }

    try {
      await inventoryClient.commit(product.reservationId);
    } catch (err) {
      if (err instanceof ConflictError) {
        throw new ConflictError(
          `The hold on ${product.productName} ran out. Remove it and scan it again.`,
        );
      }
      throw err;
    }

    await saleRepository.markCommitted(product.id);
  }

  const soldAt = new Date().toISOString();
  const cashCents = tenders
    .filter((tender) => tender.method === "CASH")
    .reduce((sum, tender) => sum + tender.amountCents, 0);
  const cardCents = settlement.paidCents - cashCents;

  const event: ItemSoldPayload = {
    saleId: sale.id,
    saleNumber: sale.saleNumber,
    storeCode: sale.storeCode,
    registerCode: sale.registerCode,
    cashierId: sale.cashierId,
    soldAt,
    totalCents: sale.totalCents,
    taxCents: sale.taxCents,
    products: sale.products.map((product) => ({
      productId: product.productId,
      sku: product.sku,
      productName: product.productName,
      quantity: product.quantity,
      unitPriceCents: product.unitPriceCents,
      totalCents: product.totalCents,
    })),
    // What stayed in the drawer and what went on cards, which is what Sales Audit counts
    payments: [
      ...(cashCents > 0
        ? [{ method: "CASH" as const, amountCents: cashCents - settlement.changeCents }]
        : []),
      ...(cardCents > 0 ? [{ method: "CARD" as const, amountCents: cardCents }] : []),
    ],
  };

  const completed = await saleRepository.complete(sale.id, {
    paidCents: settlement.paidCents,
    changeCents: settlement.changeCents,
    tenders,
    event,
  });

  if (!completed) {
    throw new ConflictError(`${sale.saleNumber} was finished at another till`);
  }

  return getSale(sale.id);
};

// The customer walked away: every hold is given back
const cancelSale = async (saleId: string) => {
  const sale = await getOpenSale(saleId);

  if (sale.products.some((product) => product.committedAt)) {
    throw new ConflictError(
      "Part of this sale has already left stock, so it cannot be cancelled; finish the payment",
    );
  }

  for (const product of sale.products) {
    await releaseQuietly(product.reservationId);
  }

  if (!(await saleRepository.cancel(sale.id))) {
    throw new ConflictError(`${sale.saleNumber} was finished at another till`);
  }

  return getSale(sale.id);
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// What a register should hold at the end of a day: the figure Sales Audit compares
// with the manager's count. Days run midnight to midnight UTC.
const getRegisterSummary = async (registerCode: string, date: unknown) => {
  const day = date === undefined ? new Date().toISOString().slice(0, 10) : date;

  if (typeof day !== "string" || !DATE_PATTERN.test(day) || Number.isNaN(Date.parse(day))) {
    throw new BadRequestError("Invalid date", { date: ["must look like 2026-09-30"] });
  }

  const from = new Date(`${day}T00:00:00.000Z`);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);

  const sales = await saleRepository.findCompletedForRegister(
    registerCode.trim().toUpperCase(),
    from.toISOString(),
    to.toISOString(),
  );

  let cashCents = 0;
  let cardCents = 0;

  for (const sale of sales) {
    for (const payment of sale.payments) {
      if (payment.method === "CASH") {
        cashCents += payment.amountCents;
      } else {
        cardCents += payment.amountCents;
      }
    }
    // Change came out of the drawer
    cashCents -= sale.changeCents;
  }

  return {
    registerCode: registerCode.trim().toUpperCase(),
    date: day,
    salesCount: sales.length,
    totalCents: sales.reduce((sum, sale) => sum + sale.totalCents, 0),
    cashCents,
    cardCents,
  };
};

export {
  addProduct,
  cancelSale,
  getRegisterSummary,
  getSale,
  openSale,
  paySale,
  removeProduct,
};
