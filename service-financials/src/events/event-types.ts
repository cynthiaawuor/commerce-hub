// The events this service listens for. Financials publishes nothing: it only records
// what the rest of the business has already done. Shapes match contracts/events/.

// Procurement approved an order: a liability is on its way. See purchase-order-approved.md
type PurchaseOrderApprovedPayload = {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  paymentTerms: string;
  totalCents: number;
  approvedAt: string;
};

// Receiving took goods in: we own them and owe the supplier. See goods-received.md
type GoodsReceivedPayload = {
  goodsReceivedNoteNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  receivedAt: string;
  products: { productId: string; quantityReceived: number; unitCostCents: number }[];
};

// Point of Sale was paid. See item-sold.md
type ItemSoldPayload = {
  saleNumber: string;
  storeCode: string;
  registerCode: string;
  soldAt: string;
  totalCents: number;
  taxCents: number;
  products: {
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    totalCents: number;
  }[];
  payments: { method: "CASH" | "CARD"; amountCents: number }[];
};

// Sales Audit signed off a register's day. See day-closed.md
type DayClosedPayload = {
  storeCode: string;
  registerCode: string;
  businessDate: string;
  // Counted minus expected: negative is short, positive is over
  cashDifferenceCents: number;
  cardDifferenceCents: number;
  explanation: string | null;
  closedBy: string;
  closedAt: string;
};

// Each queue belongs to Financials; the routing key is the publisher's
const SUBSCRIPTIONS = {
  purchaseOrderApproved: {
    queue: "financials.purchase-order-approved",
    routingKey: "procurement.purchase-order-approved",
  },
  goodsReceived: { queue: "financials.goods-received", routingKey: "receiving.goods-received" },
  itemSold: { queue: "financials.item-sold", routingKey: "pos.item-sold" },
  dayClosed: { queue: "financials.day-closed", routingKey: "sales-audit.day-closed" },
} as const;

export {
  SUBSCRIPTIONS,
  type DayClosedPayload,
  type GoodsReceivedPayload,
  type ItemSoldPayload,
  type PurchaseOrderApprovedPayload,
};
