import { NotFoundError } from "../core/http-error";
import * as purchaseOrderService from "../purchase-orders/purchase-orders.service";
import { subscribe } from "./event-consumer";
import type { EventEnvelope } from "./event-publisher";
import { PermanentEventError } from "./outbox-errors";

// Its own queue: Inventory has a separate one for the same event, so each service
// hears about every delivery and reacts at its own pace
const QUEUE = "procurement.goods-received";
const ROUTING_KEY = "receiving.goods-received";

// The shape Receiving publishes; see contracts/events/goods-received.md
type GoodsReceivedPayload = {
  goodsReceivedNoteNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  products: { productId: string; quantityReceived: number }[];
};

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): GoodsReceivedPayload => {
  const candidate = payload as Partial<GoodsReceivedPayload> | null;

  const productsLookRight =
    Array.isArray(candidate?.products) &&
    candidate.products.length > 0 &&
    candidate.products.every(
      (product) =>
        isText(product?.productId) &&
        Number.isInteger(product?.quantityReceived) &&
        product.quantityReceived > 0,
    );

  if (
    !candidate ||
    !isText(candidate.goodsReceivedNoteNumber) ||
    !isText(candidate.purchaseOrderId) ||
    !productsLookRight
  ) {
    throw new PermanentEventError(
      "GoodsReceived payload does not match contracts/events/goods-received.md",
    );
  }

  return candidate as GoodsReceivedPayload;
};

// Goods arrived against one of our orders: the order moves to partially received,
// or closes once everything is in. This is what a buyer used to do by hand.
const handleGoodsReceived = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  try {
    const order = await purchaseOrderService.receiveFromGoodsReceivedNote(
      payload.purchaseOrderId,
      payload.products,
      payload.goodsReceivedNoteNumber,
      { eventId: envelope.eventId, eventType: envelope.eventType },
    );

    console.log(
      order
        ? `${payload.purchaseOrderNumber} is now ${order.status} after ${payload.goodsReceivedNoteNumber}`
        : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
    );
  } catch (err) {
    // An order we have never heard of will not appear on a retry
    if (err instanceof NotFoundError) {
      throw new PermanentEventError(err.message);
    }
    throw err;
  }
};

const startGoodsReceivedConsumer = () =>
  subscribe({ queue: QUEUE, routingKey: ROUTING_KEY, handle: handleGoodsReceived });

export { handleGoodsReceived, startGoodsReceivedConsumer };
