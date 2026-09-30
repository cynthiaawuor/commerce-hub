import * as stockRepository from "../stock/stock.repository";
import { subscribe } from "./event-consumer";
import type { EventEnvelope } from "./event-publisher";
import type { GoodsReceivedPayload } from "./event-types";
import { findLocationId, findProductId } from "./find-by-id-or-code";
import { PermanentEventError } from "./outbox-errors";

const QUEUE = "inventory.goods-received";
const ROUTING_KEY = "receiving.goods-received";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isCount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;

const parsePayload = (payload: unknown): GoodsReceivedPayload => {
  const candidate = payload as Partial<GoodsReceivedPayload> | null;

  const productsLookRight =
    Array.isArray(candidate?.products) &&
    candidate.products.length > 0 &&
    candidate.products.every(
      (product) =>
        isText(product?.productId) &&
        isCount(product?.quantityReceived) &&
        isCount(product?.unitCostCents),
    );

  if (
    !candidate ||
    !isText(candidate.goodsReceivedNoteNumber) ||
    !isText(candidate.locationId) ||
    !productsLookRight
  ) {
    throw new PermanentEventError(
      "GoodsReceived payload does not match contracts/events/goods-received.md",
    );
  }

  return candidate as GoodsReceivedPayload;
};

// The truck arrived: stock on hand rises, what was on order falls, and the product's
// average cost is recalculated from what this delivery cost.
const handleGoodsReceived = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);
  const locationId = await findLocationId(payload.locationId);

  const lines = [];
  for (const product of payload.products) {
    lines.push({
      productId: await findProductId(product.productId),
      quantity: product.quantityReceived,
      unitCostCents: product.unitCostCents,
    });
  }

  const applied = await stockRepository.applyReceipt(
    envelope.eventId,
    envelope.eventType,
    locationId,
    payload.goodsReceivedNoteNumber,
    "receiving-service",
    lines,
  );

  console.log(
    applied
      ? `Received ${payload.goodsReceivedNoteNumber}: ${lines.length} line(s) into stock`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startGoodsReceivedConsumer = () =>
  subscribe({ queue: QUEUE, routingKey: ROUTING_KEY, handle: handleGoodsReceived });

export { QUEUE, ROUTING_KEY, handleGoodsReceived, startGoodsReceivedConsumer };
