// The event this service listens for. The name and payload shape are a contract owned
// by Receiving; see contracts/events/goods-received.md on the receiving branch.
const GOODS_RECEIVED = "GoodsReceived";

type GoodsReceivedPayload = {
  goodsReceivedNoteNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  locationId: string;
  receivedAt: string;
  products: {
    productId: string;
    // Not in the contract yet; shown to the worker when present
    productName?: string;
    quantityReceived: number;
    unitCostCents: number;
  }[];
};

export { GOODS_RECEIVED, type GoodsReceivedPayload };
