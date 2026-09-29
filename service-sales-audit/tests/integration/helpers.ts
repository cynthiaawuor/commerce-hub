import type { EventEnvelope } from "../../src/events/event-publisher";
import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
// deleteAndCount() removes every matching row; delete() would remove only one.
const resetDatabase = async () => {
  await db.orm.public.OutboxEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  await db.orm.public.ProcessedEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  // Recorded sales go with their day (onDelete: Cascade)
  await db.orm.public.RegisterDay.where((d) => d.id.isNotNull()).deleteAndCount();
};

const MANAGER = { "x-user-id": "manager@test", "x-user-role": "MANAGER" };
const CASHIER = { "x-user-id": "cashier@test", "x-user-role": "CASHIER" };

let saleSequence = 0;

// What Point of Sale publishes; see contracts/events/item-sold.md
const itemSold = (
  payments: { method: "CASH" | "CARD"; amountCents: number }[],
  { registerCode = "REG-2", soldAt = "2026-09-30T10:00:00.000Z", eventId = crypto.randomUUID() } = {},
): EventEnvelope => {
  saleSequence += 1;
  const saleNumber = `SALE-${String(saleSequence).padStart(6, "0")}`;

  return {
    eventId,
    eventType: "ItemSold",
    aggregateId: saleNumber,
    occurredAt: soldAt,
    payload: {
      saleId: crypto.randomUUID(),
      saleNumber,
      storeCode: "STORE-3",
      registerCode,
      cashierId: "cashier@test",
      soldAt,
      totalCents: payments.reduce((sum, payment) => sum + payment.amountCents, 0),
      taxCents: 0,
      products: [],
      payments,
    },
  };
};

export { CASHIER, MANAGER, itemSold, resetDatabase };
