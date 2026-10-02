import type { ItemSoldPayload } from "../events/event-types";
import * as inventoryClient from "../inventory/inventory.client";
import { allocate } from "./allocation";
import * as saleRepository from "./sales.repository";

const COSTING_BATCH = 20;
// After this many failures a sale is left for a person; it still shows as uncosted
const MAX_COST_ATTEMPTS = 10;

const sumOf = (payload: ItemSoldPayload, method: "CASH" | "CARD") =>
  payload.payments
    .filter((payment) => payment.method === method)
    .reduce((sum, payment) => sum + payment.amountCents, 0);

// Books the money side of a sale at once, then tries to book its cost. Returns null
// for a repeat event.
const bookSale = async (eventId: string, eventType: string, payload: ItemSoldPayload) => {
  // Shelf prices include VAT, so revenue is what is left once the VAT is taken out
  const netCents = payload.totalCents - payload.taxCents;

  // Each product's share of that revenue, in proportion to what it sold for, so the
  // shares add back up to the sale exactly
  const shares = allocate(
    netCents,
    payload.products.map((product) => product.totalCents),
  );

  const sale = await saleRepository.recordSale(eventId, eventType, {
    saleNumber: payload.saleNumber,
    storeCode: payload.storeCode,
    registerCode: payload.registerCode,
    soldAt: payload.soldAt,
    totalCents: payload.totalCents,
    taxCents: payload.taxCents,
    netCents,
    cashCents: sumOf(payload, "CASH"),
    cardCents: sumOf(payload, "CARD"),
    products: payload.products.map((product, index) => ({
      productId: product.productId,
      sku: product.sku,
      productName: product.productName,
      quantity: product.quantity,
      revenueCents: shares[index]!,
    })),
  });

  if (!sale) {
    return null;
  }

  // Best effort, and only this sale: the revenue is safely booked whatever happens
  // here, and the costing worker tries again later if Inventory cannot answer now
  const booked = await saleRepository.findWithProducts(sale.id);

  if (booked) {
    await costSale(booked);
  }

  return sale;
};

type WaitingSale = Awaited<ReturnType<typeof saleRepository.findWaitingForCost>>[number];

// Asks Inventory what each product cost and books the cost of goods sold.
// Returns true when the sale was costed.
const costSale = async (sale: WaitingSale) => {
  try {
    const costs = [];

    for (const product of sale.products) {
      const unitCostCents = await inventoryClient.getAverageCostCents(product.productId);

      costs.push({
        saleProductId: product.id,
        unitCostCents,
        costCents: unitCostCents * product.quantity,
      });
    }

    return (await saleRepository.recordCost(sale, costs)) !== null;
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);

    await saleRepository.recordCostFailure(sale.id, sale.costAttempts + 1, reason);
    console.warn(`Could not cost ${sale.saleNumber} (${sale.costAttempts + 1}): ${reason}`);

    return false;
  }
};

// One pass over the sales still waiting for their cost
const costWaitingSales = async () => {
  const waiting = await saleRepository.findWaitingForCost(COSTING_BATCH, MAX_COST_ATTEMPTS);
  let costed = 0;

  for (const sale of waiting) {
    if (await costSale(sale)) {
      costed += 1;
    }
  }

  return costed;
};

export { bookSale, costWaitingSales };
