import { db } from "../../src/prisma/db";

// Each test starts from a clean slate, so results never depend on what ran before.
const resetDatabase = async () => {
  await db.orm.public.OutboxEvent.where((e) => e.id.isNotNull()).delete();
  await db.orm.public.ReorderSuggestion.where((s) => s.id.isNotNull()).delete();
  // Lines and status history go with the order (onDelete: Cascade)
  await db.orm.public.PurchaseOrder.where((po) => po.id.isNotNull()).delete();
};

const BUYER = { "x-user-id": "buyer@test", "x-user-role": "BUYER" };
const OTHER_BUYER = { "x-user-id": "other@test", "x-user-role": "BUYER" };
const MANAGER = { "x-user-id": "manager@test", "x-user-role": "MANAGER" };

// What the fake Vendor Management returns
const SUPPLIER = {
  id: "sup-1",
  name: "Soko Yetu Supplies",
  paymentTerms: "NET_30",
  status: "ACTIVE",
};

const OFFER = {
  supplierId: SUPPLIER.id,
  supplierName: SUPPLIER.name,
  paymentTerms: SUPPLIER.paymentTerms,
  catalogItemId: "cat-1",
  productId: "PROD-1",
  productName: "Maize flour 2kg",
  unitPrice: 1250.5,
  leadTimeDays: 7,
};

export { BUYER, MANAGER, OFFER, OTHER_BUYER, SUPPLIER, resetDatabase };
