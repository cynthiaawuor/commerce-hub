import * as putawayTaskService from "../putaway-tasks/putaway-tasks.service";
import { subscribe } from "./event-consumer";
import type { EventEnvelope } from "./event-publisher";
import type { GoodsReceivedPayload } from "./event-types";
import { PermanentEventError } from "./outbox-errors";

// Its own queue: Procurement and Inventory have separate ones for the same event, so
// each service gets every delivery and reads it at its own pace
const QUEUE = "warehouse.goods-received";
const ROUTING_KEY = "receiving.goods-received";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isPositiveWholeNumber = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) > 0;

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): GoodsReceivedPayload => {
  const candidate = payload as Partial<GoodsReceivedPayload> | null;

  if (
    !candidate ||
    !isText(candidate.goodsReceivedNoteNumber) ||
    !isText(candidate.purchaseOrderNumber) ||
    !Array.isArray(candidate.products) ||
    candidate.products.length === 0 ||
    !candidate.products.every(
      (product) => isText(product?.productId) && isPositiveWholeNumber(product?.quantityReceived),
    )
  ) {
    throw new PermanentEventError(
      "GoodsReceived payload is missing its note number, order number or products",
    );
  }

  return candidate as GoodsReceivedPayload;
};

// The spec's "Warehouse Ops listens so it can create a putaway task for the dock stock"
const handleGoodsReceived = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const tasks = await putawayTaskService.planPutaway(
    envelope.eventId,
    envelope.eventType,
    payload,
  );

  console.log(
    tasks
      ? `Created ${tasks.length} putaway task(s) for ${payload.goodsReceivedNoteNumber}`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startGoodsReceivedConsumer = () =>
  subscribe({ queue: QUEUE, routingKey: ROUTING_KEY, handle: handleGoodsReceived });

export { handleGoodsReceived, startGoodsReceivedConsumer };
