import type { EventEnvelope } from "../../src/events/event-publisher";
import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
// deleteAndCount() removes every matching row; delete() would remove only one.
const resetDatabase = async () => {
  await db.orm.public.ProcessedEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  await db.orm.public.PutawayTask.where((t) => t.id.isNotNull()).deleteAndCount();
  // What is on each shelf goes with the shelf (onDelete: Cascade)
  await db.orm.public.ShelfLocation.where((s) => s.id.isNotNull()).deleteAndCount();
};

const WORKER = { "x-user-id": "worker@test", "x-user-role": "WORKER" };
const SUPERVISOR = { "x-user-id": "supervisor@test", "x-user-role": "SUPERVISOR" };

// Two shelves: a small one by the dock and a big one at the back
const addShelves = async () => {
  await db.orm.public.ShelfLocation.create({
    code: "A-01",
    zone: "A",
    distanceFromDock: 5,
    capacityUnits: 10,
  });
  await db.orm.public.ShelfLocation.create({
    code: "B-01",
    zone: "B",
    distanceFromDock: 30,
    capacityUnits: 100,
  });
};

type ReceivedProduct = { productId: string; productName?: string; quantityReceived: number };

// What Receiving publishes; see contracts/events/goods-received.md
const goodsReceived = (
  products: ReceivedProduct[],
  goodsReceivedNoteNumber = "GRN-000001",
  eventId = crypto.randomUUID(),
): EventEnvelope => ({
  eventId,
  eventType: "GoodsReceived",
  aggregateId: goodsReceivedNoteNumber,
  occurredAt: new Date().toISOString(),
  payload: {
    goodsReceivedNoteNumber,
    purchaseOrderId: "order-1",
    purchaseOrderNumber: "PO-000001",
    locationId: "WH-MAIN",
    receivedAt: new Date().toISOString(),
    products: products.map((product) => ({ unitCostCents: 18000, ...product })),
  },
});

export { SUPERVISOR, WORKER, addShelves, goodsReceived, resetDatabase };
