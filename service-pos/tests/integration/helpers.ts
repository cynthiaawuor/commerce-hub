import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
// deleteAndCount() removes every matching row; delete() would remove only one.
const resetDatabase = async () => {
  await db.orm.public.OutboxEvent.where((e) => e.id.isNotNull()).deleteAndCount();
  // Products and payments go with the sale (onDelete: Cascade)
  await db.orm.public.Sale.where((s) => s.id.isNotNull()).deleteAndCount();
  await db.orm.public.ProductPrice.where((p) => p.id.isNotNull()).deleteAndCount();
};

const CASHIER = { "x-user-id": "cashier@test", "x-user-role": "CASHIER" };
const MANAGER = { "x-user-id": "manager@test", "x-user-role": "MANAGER" };

export { CASHIER, MANAGER, resetDatabase };
