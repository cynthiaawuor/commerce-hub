import type { EventEnvelope } from "../../src/events/event-envelope";
import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
// deleteAndCount() removes every matching row; delete() would remove only one.
const resetDatabase = async () => {
  await db.orm.public.ProcessedEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  // Payments go with their bill, products with their sale, lines with their entry
  await db.orm.public.SupplierBill.where((b) => b.id.isNotNull()).deleteAndCount();
  await db.orm.public.PurchaseCommitment.where((c) => c.purchaseOrderId.isNotNull()).deleteAndCount();
  await db.orm.public.Sale.where((s) => s.id.isNotNull()).deleteAndCount();
  await db.orm.public.JournalEntry.where((e) => e.id.isNotNull()).deleteAndCount();
};

const FINANCE = { "x-user-id": "accountant@test", "x-user-role": "FINANCE" };
const CASHIER = { "x-user-id": "cashier@test", "x-user-role": "CASHIER" };

const envelope = (eventType: string, aggregateId: string, payload: unknown): EventEnvelope => ({
  eventId: crypto.randomUUID(),
  eventType,
  aggregateId,
  occurredAt: new Date().toISOString(),
  payload,
});

// What Procurement publishes: an order for KES 2,000 on 30-day terms
const purchaseOrderApproved = () =>
  envelope("PurchaseOrderApproved", "order-1", {
    purchaseOrderId: "order-1",
    purchaseOrderNumber: "PO-000001",
    supplierId: "sup-1",
    supplierName: "Soko Yetu Supplies",
    paymentTerms: "NET_30",
    currency: "KES",
    totalCents: 200000,
    approvedBy: "manager@test",
    approvedAt: "2026-09-01T08:00:00.000Z",
    products: [],
  });

// What Receiving publishes: 10 units accepted at KES 100 each = KES 1,000
const goodsReceived = (goodsReceivedNoteNumber = "GRN-000001", quantityReceived = 10) =>
  envelope("GoodsReceived", goodsReceivedNoteNumber, {
    goodsReceivedNoteNumber,
    purchaseOrderId: "order-1",
    purchaseOrderNumber: "PO-000001",
    locationId: "WH-MAIN",
    receivedAt: "2026-09-10T09:00:00.000Z",
    products: [{ productId: "prod-rice", quantityReceived, unitCostCents: 10000 }],
  });

// What Point of Sale publishes: 2 rice at KES 180 and 1 oil at KES 950 = KES 1,310,
// of which KES 180.69 is VAT, paid in cash
const itemSold = (saleNumber = "SALE-000001", overrides: Record<string, unknown> = {}) =>
  envelope("ItemSold", saleNumber, {
    saleId: crypto.randomUUID(),
    saleNumber,
    storeCode: "STORE-3",
    registerCode: "REG-2",
    cashierId: "cashier@test",
    soldAt: "2026-09-15T10:00:00.000Z",
    totalCents: 131000,
    taxCents: 18069,
    products: [
      { productId: "prod-rice", sku: "RICE-1KG", productName: "Rice 1kg", quantity: 2, unitPriceCents: 18000, totalCents: 36000 },
      { productId: "prod-oil", sku: "OIL-5L", productName: "Cooking oil 5L", quantity: 1, unitPriceCents: 95000, totalCents: 95000 },
    ],
    payments: [{ method: "CASH", amountCents: 131000 }],
    ...overrides,
  });

// What Sales Audit publishes
const dayClosed = (cashDifferenceCents: number, explanation: string | null = null) =>
  envelope("DayClosed", "REG-2/2026-09-15", {
    registerDayId: crypto.randomUUID(),
    storeCode: "STORE-3",
    registerCode: "REG-2",
    businessDate: "2026-09-15",
    salesCount: 1,
    cashDifferenceCents,
    cardDifferenceCents: 0,
    differenceCents: cashDifferenceCents,
    explanation,
    closedBy: "manager@test",
    closedAt: "2026-09-15T18:00:00.000Z",
  });

// The whole of September 2026, which every event above falls in
const SEPTEMBER = "from=2026-09-01&to=2026-09-30";

export {
  CASHIER,
  FINANCE,
  SEPTEMBER,
  dayClosed,
  goodsReceived,
  itemSold,
  purchaseOrderApproved,
  resetDatabase,
};
