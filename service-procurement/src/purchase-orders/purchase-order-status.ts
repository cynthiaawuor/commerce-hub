// Mirrors the PurchaseOrderStatus enum in contract.prisma.
// A plain array + union (rather than a TS enum) so the values are the same string
// literals the Prisma contract expects.
const PURCHASE_ORDER_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "SENT",
  "PARTIALLY_RECEIVED",
  "CLOSED",
  "CANCELLED",
] as const;

type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export { PURCHASE_ORDER_STATUSES, type PurchaseOrderStatus };
