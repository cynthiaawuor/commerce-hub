// Events this service publishes, and the ones it listens for. The names and payload
// shapes are contracts other services code against; see contracts/events/.

const STOCK_LOW = "StockLow";

type StockLowPayload = {
  productId: string;
  productName: string;
  locationId: string;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
};

// Consumed: Procurement announces an order the business has committed to
type PurchaseOrderApprovedPayload = {
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  lines: {
    productId: string;
    productName: string;
    quantityOrdered: number;
    unitCostCents: number;
    leadTimeDays: number;
  }[];
};

// Consumed: Receiving announces goods taken into the business
type GoodsReceivedPayload = {
  grnId: string;
  purchaseOrderId: string;
  locationId: string;
  receivedAt: string;
  lines: {
    productId: string;
    quantityReceived: number;
    unitCostCents: number;
  }[];
};

// Subscribers bind to patterns such as "inventory.#", so the key starts with the
// publishing service and narrows from there.
const routingKeyFor = (eventType: string) => {
  const kebab = eventType.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  return `inventory.${kebab}`;
};

export {
  STOCK_LOW,
  routingKeyFor,
  type GoodsReceivedPayload,
  type PurchaseOrderApprovedPayload,
  type StockLowPayload,
};
