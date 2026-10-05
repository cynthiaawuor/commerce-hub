import { ITEM_SOLD, type ItemSoldPayload } from "../events/event-types";
import { db } from "../prisma/db";
import { vatInside, type Tender } from "./checkout-rules";

const Sale = db.orm.public.Sale;

// The context db.transaction() hands to its callback
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type NewSale = {
  saleNumber: string;
  storeCode: string;
  registerCode: string;
  cashierId: string;
};

type NewSaleProduct = {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  reservationId: string;
};

const count = async () => (await Sale.aggregate((a) => ({ total: a.count() }))).total;

const findById = async (id: string) =>
  Sale.where({ id })
    .include("products", (product) => product.orderBy((p) => p.createdAt.asc()))
    .include("payments", (payment) => payment)
    .first();

const insert = async (sale: NewSale) => Sale.create(sale);

// The total is derived from the products, so it is recalculated inside the same
// transaction as every change to them and never drifts.
const recalculateTotal = async (tx: Tx, saleId: string, vatRatePercent: number) => {
  const products = await tx.orm.public.SaleProduct.where({ saleId })
    .select("totalCents")
    .all();

  const totalCents = products.reduce((sum, product) => sum + product.totalCents, 0);

  await tx.orm.public.Sale.where({ id: saleId }).update({
    totalCents,
    taxCents: vatInside(totalCents, vatRatePercent),
  });
};

const addProduct = async (saleId: string, product: NewSaleProduct, vatRatePercent: number) =>
  db.transaction(async (tx) => {
    const created = await tx.orm.public.SaleProduct.create({ ...product, saleId });
    await recalculateTotal(tx, saleId, vatRatePercent);
    return created;
  });

const removeProduct = async (saleId: string, saleProductId: string, vatRatePercent: number) =>
  db.transaction(async (tx) => {
    await tx.orm.public.SaleProduct.where({ id: saleProductId, saleId }).delete();
    await recalculateTotal(tx, saleId, vatRatePercent);
  });

// Inventory has taken this stock. Recorded at once, so a payment retried after a
// failure never asks Inventory to sell the same units twice.
const markCommitted = async (saleProductId: string) =>
  db.orm.public.SaleProduct.where({ id: saleProductId }).update({
    committedAt: new Date().toISOString(),
  });

type Completion = {
  paidCents: number;
  changeCents: number;
  tenders: Tender[];
  event: ItemSoldPayload;
};

// The sale, its payments and the ItemSold event are written together: the event can
// never announce a sale that was not recorded, and a recorded sale always has one.
// Returns null when the sale was no longer open (another till finished it first).
const complete = async (saleId: string, completion: Completion) =>
  db.transaction(async (tx) => {
    const completed = await tx.orm.public.Sale.where({ id: saleId, status: "OPEN" }).update({
      status: "COMPLETED",
      paidCents: completion.paidCents,
      changeCents: completion.changeCents,
      completedAt: completion.event.soldAt,
    });

    if (!completed) {
      return null;
    }

    for (const tender of completion.tenders) {
      await tx.orm.public.Payment.create({ ...tender, saleId });
    }

    await tx.orm.public.OutboxEvent.create({
      eventType: ITEM_SOLD,
      aggregateId: completion.event.saleNumber,
      payload: JSON.stringify(completion.event),
    });

    return completed;
  });

// Returns null when the sale was no longer open
const cancel = async (saleId: string) =>
  Sale.where({ id: saleId, status: "OPEN" }).update({ status: "CANCELLED" });

// Everything a register sold between two instants, for the end-of-day count
const findCompletedForRegister = async (registerCode: string, from: string, to: string) =>
  Sale.where({ registerCode, status: "COMPLETED" })
    .where((sale) => sale.completedAt.gte(from))
    .where((sale) => sale.completedAt.lt(to))
    .include("payments", (payment) => payment)
    .all();

export {
  addProduct,
  cancel,
  complete,
  count,
  findById,
  findCompletedForRegister,
  insert,
  markCommitted,
  removeProduct,
  type NewSaleProduct,
};
