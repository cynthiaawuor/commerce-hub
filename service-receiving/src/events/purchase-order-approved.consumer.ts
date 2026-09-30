import * as expectedDeliveryRepository from "../expected-deliveries/expected-deliveries.repository";
import { subscribe } from "./event-consumer";
import type { EventEnvelope } from "./event-publisher";
import type { PurchaseOrderApprovedPayload } from "./event-types";
import { PermanentEventError } from "./outbox-errors";

// Its own queue: Inventory has a separate one for the same event, so each service
// gets every approval and reads it at its own pace
const QUEUE = "receiving.purchase-order-approved";
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
    !isText(candidate.supplierId) ||
    !Array.isArray(candidate.products) ||
    candidate.products.length === 0
  ) {
    throw new PermanentEventError(
      "PurchaseOrderApproved payload is missing an order, its supplier or its products",
    );
  }

  return candidate as PurchaseOrderApprovedPayload;
};

// The spec's "Receiving listens so it knows to expect a delivery from Supplier A".
// Keeping its own copy means the dock can still check a truck in while Procurement is down.
const handlePurchaseOrderApproved = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const delivery = await expectedDeliveryRepository.insertFromApprovedOrder(
    envelope.eventId,
    envelope.eventType,
    {
      purchaseOrderId: payload.purchaseOrderId,
      purchaseOrderNumber: payload.purchaseOrderNumber,
      supplierId: payload.supplierId,
      supplierName: payload.supplierName ?? payload.supplierId,
      products: payload.products.map((product) => ({
        productId: product.productId,
        productName: product.productName ?? product.productId,
        quantityOrdered: product.quantityOrdered,
        unitCostCents: product.unitCostCents,
      })),
    },
  );

  console.log(
    delivery
      ? `Expecting a delivery for ${payload.purchaseOrderNumber} (${payload.products.length} product(s))`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startPurchaseOrderApprovedConsumer = () =>
  subscribe({
    queue: QUEUE,
    routingKey: ROUTING_KEY,
    handle: handlePurchaseOrderApproved,
  });

export { handlePurchaseOrderApproved, startPurchaseOrderApprovedConsumer };
