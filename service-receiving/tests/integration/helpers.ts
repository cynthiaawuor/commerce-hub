import type { EventEnvelope } from "../../src/events/event-publisher";
import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
const resetDatabase = async () => {
  await db.orm.public.OutboxEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  await db.orm.public.ProcessedEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  await db.orm.public.GoodsReceivedNoteProduct.where((p) => p.id.isNotNull()).deleteAndCount();
  await db.orm.public.GoodsReceivedNote.where((n) => n.id.isNotNull()).deleteAndCount();
  await db.orm.public.ExpectedProduct.where((p) => p.id.isNotNull()).deleteAndCount();
  await db.orm.public.ExpectedDelivery.where((d) => d.id.isNotNull()).deleteAndCount();
};

const DOCK_CLERK = { "x-user-id": "dock-clerk@test" };

// What Procurement publishes; see contracts/events/purchase-order-approved.md
const purchaseOrderApproved = (eventId = crypto.randomUUID()): EventEnvelope => ({
  eventId,
  eventType: "PurchaseOrderApproved",
  aggregateId: "order-1",
  occurredAt: new Date().toISOString(),
  payload: {
    purchaseOrderId: "order-1",
    purchaseOrderNumber: "PO-000001",
    supplierId: "sup-1",
    supplierName: "Soko Yetu Supplies",
    products: [
      { productId: "PROD-1", productName: "Maize flour 2kg", quantityOrdered: 10, unitCostCents: 125050 },
      { productId: "PROD-2", productName: "Rice 1kg", quantityOrdered: 5, unitCostCents: 18000 },
    ],
  },
});

export { DOCK_CLERK, purchaseOrderApproved, resetDatabase };
