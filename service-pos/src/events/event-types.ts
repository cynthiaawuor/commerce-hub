// The event this service publishes. The name and payload shape are a contract other
// services code against; see contracts/events/item-sold.md.

// Published: a sale has been paid for and the stock has left the store
const ITEM_SOLD = "ItemSold";

type ItemSoldPayload = {
  saleId: string;
  saleNumber: string;
  storeCode: string;
  registerCode: string;
  cashierId: string;
  soldAt: string;
  totalCents: number;
  taxCents: number;
  products: {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }[];
  // Cash is net of change given, so the amounts add up to totalCents
  payments: { method: "CASH" | "CARD"; amountCents: number }[];
};

// Subscribers bind to patterns such as "pos.#", so the key starts with the publishing
// service and narrows from there.
const routingKeyFor = (eventType: string) => {
  const kebab = eventType.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  return `pos.${kebab}`;
};

export { ITEM_SOLD, routingKeyFor, type ItemSoldPayload };
