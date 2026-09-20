// Domain events this service publishes. The name is the contract other services code
// against, so renaming one is a breaking change for every subscriber.
const PURCHASE_ORDER_APPROVED = "PurchaseOrderApproved";

type PurchaseOrderApprovedPayload = {
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  currency: string;
  totalCents: number;
  approvedBy: string;
  approvedAt: string;
  lines: {
    productId: string;
    productName: string;
    quantityOrdered: number;
    unitCostCents: number;
    leadTimeDays: number;
  }[];
};

// Subscribers bind to patterns such as "procurement.#", so the key starts with the
// publishing service and narrows from there.
const routingKeyFor = (eventType: string) => {
  const kebab = eventType
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

  return `procurement.${kebab}`;
};

export {
  PURCHASE_ORDER_APPROVED,
  routingKeyFor,
  type PurchaseOrderApprovedPayload,
};
