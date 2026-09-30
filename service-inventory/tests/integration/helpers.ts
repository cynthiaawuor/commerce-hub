import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
// Levels, movements and reservations go when their product does (onDelete: Cascade).
const resetDatabase = async () => {
  await db.orm.public.OutboxEvent.where((e) => e.id.isNotNull()).delete();
  await db.orm.public.ProcessedEvent.where((e) => e.id.isNotNull()).delete();
  await db.orm.public.Reservation.where((r) => r.id.isNotNull()).delete();
  await db.orm.public.StockMovement.where((m) => m.id.isNotNull()).delete();
  await db.orm.public.StockLevel.where((l) => l.id.isNotNull()).delete();
  await db.orm.public.Product.where((p) => p.id.isNotNull()).delete();
  await db.orm.public.Location.where((l) => l.id.isNotNull()).delete();
};

const CLERK = { "x-user-id": "stock-clerk@test" };
const TILL = { "x-user-id": "till-1@store3" };

export { CLERK, TILL, resetDatabase };
