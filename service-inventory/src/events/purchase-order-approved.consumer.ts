import { config } from "../core/config";
import * as stockRepository from "../stock/stock.repository";
import { subscribe } from "./event-consumer";
import type { EventEnvelope } from "./event-publisher";
import type { PurchaseOrderApprovedPayload } from "./event-types";
import { findLocationId, findProductId } from "./find-by-id-or-code";
import { PermanentEventError } from "./outbox-errors";

const QUEUE = "inventory.purchase-order-approved";
const ROUTING_KEY = "procurement.purchase-order-approved";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): PurchaseOrderApprovedPayload => {
  const candidate = payload as Partial<PurchaseOrderApprovedPayload> | null;

  if (
    !candidate ||
    !isText(candidate.purchaseOrderId) ||
    !isText(candidate.purchaseOrderNumber) ||
    !Array.isArray(candidate.products) ||
    candidate.products.length === 0
  ) {
    throw new PermanentEventError(
      "PurchaseOrderApproved payload is missing an order or its products",
    );
  }

  return candidate as PurchaseOrderApprovedPayload;
};

// Goods the business has committed to buy but does not hold yet. Tracking them stops a
// buyer ordering the same shortage twice while the first delivery is still in transit.
//
// The event does not say where the goods will land, so they are counted against the
// default receiving location; GoodsReceived says where they actually arrived.
const handlePurchaseOrderApproved = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);
  const locationId = await findLocationId(config.defaultLocationCode);

  const ordered = [];
  for (const product of payload.products) {
    ordered.push({
      productId: await findProductId(product.productId),
      locationId,
      quantity: product.quantityOrdered,
    });
  }

  const applied = await stockRepository.applyOnOrder(
    envelope.eventId,
    envelope.eventType,
    ordered,
  );

  console.log(
    applied
      ? `On order raised for ${payload.purchaseOrderNumber} (${ordered.length} product(s))`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startPurchaseOrderApprovedConsumer = () =>
  subscribe({
    queue: QUEUE,
    routingKey: ROUTING_KEY,
    handle: handlePurchaseOrderApproved,
  });

export {
  QUEUE,
  ROUTING_KEY,
  handlePurchaseOrderApproved,
  startPurchaseOrderApprovedConsumer,
};
