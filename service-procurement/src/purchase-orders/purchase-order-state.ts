import type { PurchaseOrderStatus } from "./purchase-order-status";

// The lifecycle, as a table of allowed moves. Anything not listed is refused, so an order
// can never skip approval (DRAFT → SENT) or come back to life once CLOSED or CANCELLED.
const ALLOWED_TRANSITIONS: Record<
  PurchaseOrderStatus,
  readonly PurchaseOrderStatus[]
> = {
  DRAFT: ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED", "CANCELLED"],
  // A rejected order goes back to the buyer, who fixes it and submits again
  REJECTED: ["DRAFT", "CANCELLED"],
  APPROVED: ["SENT", "CANCELLED"],
  SENT: ["PARTIALLY_RECEIVED", "CLOSED", "CANCELLED"],
  PARTIALLY_RECEIVED: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  CANCELLED: [],
};

const canTransition = (from: PurchaseOrderStatus, to: PurchaseOrderStatus) =>
  ALLOWED_TRANSITIONS[from].includes(to);

// Lines and supplier details are frozen the moment an order leaves DRAFT
const isEditable = (status: PurchaseOrderStatus) => status === "DRAFT";

// No move leads out of a final status
const isFinal = (status: PurchaseOrderStatus) =>
  ALLOWED_TRANSITIONS[status].length === 0;

const allowedTransitionsFrom = (status: PurchaseOrderStatus) =>
  ALLOWED_TRANSITIONS[status];

export { allowedTransitionsFrom, canTransition, isEditable, isFinal };
