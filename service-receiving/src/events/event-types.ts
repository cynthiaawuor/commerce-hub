// Events this service publishes, and the one it listens for. The names and payload
// shapes are contracts other services code against; see contracts/events/.

// Published: goods have been checked and taken into the business
const GOODS_RECEIVED = "GoodsReceived";

// Matches contracts/events/goods-received.md
type GoodsReceivedPayload = {
  goodsReceivedNoteNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  locationId: string;
  receivedAt: string;
  products: {
    productId: string;
    quantityReceived: number;
    unitCostCents: number;
  }[];
};

// Consumed: Procurement announces an order the business has committed to.
// Matches contracts/events/purchase-order-approved.md
type PurchaseOrderApprovedPayload = {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  products: {
    productId: string;
    productName: string;
    quantityOrdered: number;
    unitCostCents: number;
  }[];
};

// Subscribers bind to patterns such as "receiving.#", so the key starts with the
// publishing service and narrows from there.
const routingKeyFor = (eventType: string) => {
  const kebab = eventType.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  return `receiving.${kebab}`;
};

export {
  GOODS_RECEIVED,
  routingKeyFor,
  type GoodsReceivedPayload,
  type PurchaseOrderApprovedPayload,
};
