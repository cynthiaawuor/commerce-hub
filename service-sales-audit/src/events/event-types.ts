// Events this service publishes, and the one it listens for. The names and payload
// shapes are contracts other services code against; see contracts/events/.

// Consumed: Point of Sale announces a paid sale. Matches contracts/events/item-sold.md
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
  products: unknown[];
  // Cash is net of change given, so the amounts add up to totalCents
  payments: { method: "CASH" | "CARD"; amountCents: number }[];
};

// Published: a register's day has been counted, explained and signed off.
// Financials books any difference as cash over or short.
const DAY_CLOSED = "DayClosed";

type DayClosedPayload = {
  registerDayId: string;
  storeCode: string;
  registerCode: string;
  businessDate: string;
  salesCount: number;
  expectedCashCents: number;
  expectedCardCents: number;
  countedCashCents: number;
  countedCardCents: number;
  // Counted minus expected: negative is short, positive is over
  cashDifferenceCents: number;
  cardDifferenceCents: number;
  differenceCents: number;
  explanation: string | null;
  closedBy: string;
  closedAt: string;
};

// Subscribers bind to patterns such as "sales-audit.#", so the key starts with the
// publishing service and narrows from there.
const routingKeyFor = (eventType: string) => {
  const kebab = eventType.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

  return `sales-audit.${kebab}`;
};

export {
  DAY_CLOSED,
  ITEM_SOLD,
  routingKeyFor,
  type DayClosedPayload,
  type ItemSoldPayload,
};
