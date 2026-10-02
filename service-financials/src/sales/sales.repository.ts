import { claimEvent } from "../events/processed-events.repository";
import { postEntry } from "../ledger/ledger.repository";
import * as postings from "../ledger/postings";
import { db } from "../prisma/db";

const Sale = db.orm.public.Sale;
const SaleProduct = db.orm.public.SaleProduct;

type SoldProduct = {
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  // This product's share of the sale, net of VAT
  revenueCents: number;
};

type SoldSale = {
  saleNumber: string;
  storeCode: string;
  registerCode: string;
  soldAt: string;
  totalCents: number;
  taxCents: number;
  netCents: number;
  cashCents: number;
  cardCents: number;
  products: SoldProduct[];
};

// A paid sale: Dr Cash / Card, Cr VAT payable, Cr Sales revenue. The cost of the goods
// is booked separately, once Inventory has said what they cost.
// Returns null for a repeat event, or for a sale already booked under another event id.
const recordSale = async (eventId: string, eventType: string, sale: SoldSale) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    const alreadyBooked = await tx.orm.public.Sale.where({ saleNumber: sale.saleNumber }).first();

    if (alreadyBooked) {
      return null;
    }

    const created = await tx.orm.public.Sale.create({
      saleNumber: sale.saleNumber,
      storeCode: sale.storeCode,
      registerCode: sale.registerCode,
      soldAt: sale.soldAt,
      totalCents: sale.totalCents,
      taxCents: sale.taxCents,
      netCents: sale.netCents,
    });

    for (const product of sale.products) {
      await tx.orm.public.SaleProduct.create({
        ...product,
        saleId: created.id,
        storeCode: sale.storeCode,
        soldAt: sale.soldAt,
      });
    }

    await postEntry(tx, {
      source: "SALE",
      reference: sale.saleNumber,
      description: `Sale at ${sale.registerCode}`,
      storeCode: sale.storeCode,
      occurredAt: sale.soldAt,
      lines: postings.sale(sale),
    });

    return created;
  });

// Sales whose cost is not booked yet, oldest first. Ones that have failed too many
// times are left for a person to look at; they still show in the reports as uncosted.
const findWaitingForCost = async (limit: number, maxAttempts: number) =>
  Sale.where({ costStatus: "PENDING" })
    .where((sale) => sale.costAttempts.lt(maxAttempts))
    .include("products", (product) => product)
    .orderBy((sale) => sale.soldAt.asc())
    .limit(limit)
    .all();

const findWithProducts = async (id: string) =>
  Sale.where({ id })
    .include("products", (product) => product)
    .first();

type ProductCost = { saleProductId: string; unitCostCents: number; costCents: number };

type SaleToCost = { id: string; saleNumber: string; storeCode: string; soldAt: string };

// Dr Cost of goods sold, Cr Inventory, dated when the sale happened. The sale is only
// marked if it was still waiting, so two passes cannot book the same cost twice.
// Returns null when another pass got there first.
const recordCost = async (sale: SaleToCost, costs: ProductCost[]) =>
  db.transaction(async (tx) => {
    const costCents = costs.reduce((sum, cost) => sum + cost.costCents, 0);

    const costed = await tx.orm.public.Sale.where({ id: sale.id, costStatus: "PENDING" }).update({
      costStatus: "COSTED",
      costCents,
      lastCostError: null,
    });

    if (!costed) {
      return null;
    }

    for (const cost of costs) {
      await tx.orm.public.SaleProduct.where({ id: cost.saleProductId }).update({
        unitCostCents: cost.unitCostCents,
        costCents: cost.costCents,
      });
    }

    // Stock recorded at no cost (counted in, never bought) has nothing to book
    if (costCents > 0) {
      await postEntry(tx, {
        source: "SALE_COST",
        reference: sale.saleNumber,
        description: `Cost of goods sold on ${sale.saleNumber}`,
        storeCode: sale.storeCode,
        occurredAt: sale.soldAt,
        lines: postings.saleCost(costCents),
      });
    }

    return costed;
  });

const recordCostFailure = async (saleId: string, attempts: number, reason: string) =>
  Sale.where({ id: saleId }).update({ costAttempts: attempts, lastCostError: reason });

type TillClose = {
  storeCode: string;
  registerCode: string;
  businessDate: string;
  cashDifferenceCents: number;
  cardDifferenceCents: number;
  explanation: string | null;
  closedAt: string;
};

// A till signed off over or short: the difference goes to Cash over / short.
// A till that balanced leaves the books alone. Returns null for a repeat event.
const recordTillClose = async (eventId: string, eventType: string, close: TillClose) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    const lines = postings.dayClosed(close);

    if (lines.length === 0) {
      return { posted: false };
    }

    await postEntry(tx, {
      source: "DAY_CLOSED",
      reference: `${close.registerCode}/${close.businessDate}`,
      description: close.explanation
        ? `Till difference at ${close.registerCode}: ${close.explanation}`
        : `Till difference at ${close.registerCode}`,
      storeCode: close.storeCode,
      occurredAt: close.closedAt,
      lines,
    });

    return { posted: true };
  });

type Period = { startsAt: string; endsBefore: string };

const soldBetween = ({ startsAt, endsBefore }: Period) =>
  SaleProduct.where((product) => product.soldAt.gte(startsAt)).where((product) =>
    product.soldAt.lt(endsBefore),
  );

// Postgres sums int4 as bigint, which arrives as a string
const totals = (row: { quantity: unknown; revenue: unknown; cost: unknown }) => ({
  quantity: Number(row.quantity ?? 0),
  revenueCents: Number(row.revenue ?? 0),
  costCents: Number(row.cost ?? 0),
});

// What each product sold and cost over a period. Cost only counts products already costed.
const sumByProduct = async (period: Period) =>
  (
    await soldBetween(period)
      .groupBy("sku", "productName")
      .aggregate((a) => ({
        quantity: a.sum("quantity"),
        revenue: a.sum("revenueCents"),
        cost: a.sum("costCents"),
      }))
  ).map((row) => ({ sku: row.sku, productName: row.productName, ...totals(row) }));

const sumByStore = async (period: Period) =>
  (
    await soldBetween(period)
      .groupBy("storeCode")
      .aggregate((a) => ({
        quantity: a.sum("quantity"),
        revenue: a.sum("revenueCents"),
        cost: a.sum("costCents"),
      }))
  ).map((row) => ({ storeCode: row.storeCode, ...totals(row) }));

// Sales in the period whose cost is not booked yet, so a report can say its profit is
// overstated instead of quietly showing it
const countUncosted = async ({ startsAt, endsBefore }: Period) =>
  (
    await Sale.where({ costStatus: "PENDING" })
      .where((sale) => sale.soldAt.gte(startsAt))
      .where((sale) => sale.soldAt.lt(endsBefore))
      .aggregate((a) => ({ total: a.count() }))
  ).total;

export {
  countUncosted,
  findWaitingForCost,
  findWithProducts,
  recordCost,
  recordCostFailure,
  recordSale,
  recordTillClose,
  sumByProduct,
  sumByStore,
  type SoldSale,
  type TillClose,
};
