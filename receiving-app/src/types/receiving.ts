export type ExpectedProduct = {
  id: string;
  productId: string;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityOutstanding: number;
};

export type ExpectedDelivery = {
  id: string;
  purchaseOrderNumber: string;
  supplierName: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  products: ExpectedProduct[];
};

export type Discrepancy = "NONE" | "LESS" | "MORE" | "NOT_ORDERED";

export type GoodsReceivedNoteProduct = {
  id: string;
  productId: string;
  productName: string;
  quantityExpected: number;
  quantityDelivered: number;
  quantityDamaged: number;
  quantityAccepted: number;
  discrepancy: Discrepancy;
};

export type GoodsReceivedNote = {
  id: string;
  goodsReceivedNoteNumber: string;
  purchaseOrderNumber: string;
  locationCode: string;
  receivedBy: string;
  createdAt: string;
  products: GoodsReceivedNoteProduct[];
};
