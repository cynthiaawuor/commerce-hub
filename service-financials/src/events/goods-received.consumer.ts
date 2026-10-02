import * as payablesRepository from "../payables/payables.repository";
import { subscribe } from "./event-consumer";
import { PermanentEventError, type EventEnvelope } from "./event-envelope";
import { SUBSCRIPTIONS, type GoodsReceivedPayload } from "./event-types";
import { isAmount, isText, isTime } from "./payload-checks";

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): GoodsReceivedPayload => {
  const candidate = payload as Partial<GoodsReceivedPayload> | null;

  if (
    !candidate ||
    !isText(candidate.goodsReceivedNoteNumber) ||
    !isText(candidate.purchaseOrderId) ||
    !isText(candidate.purchaseOrderNumber) ||
    !isTime(candidate.receivedAt) ||
    !Array.isArray(candidate.products) ||
    candidate.products.length === 0 ||
    !candidate.products.every(
      (product) =>
        isText(product?.productId) &&
        isAmount(product?.quantityReceived) &&
        isAmount(product?.unitCostCents),
    )
  ) {
    throw new PermanentEventError(
      "GoodsReceived payload is missing its note number, order, time or products",
    );
  }

  return candidate as GoodsReceivedPayload;
};

// The spec's "Dr Inventory, Cr Accounts payable" when a delivery is accepted. The
// amount is what was accepted at the price on the order.
const handleGoodsReceived = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const amountCents = payload.products.reduce(
    (sum, product) => sum + product.quantityReceived * product.unitCostCents,
    0,
  );

  // Goods received at no cost create nothing to own or owe
  if (amountCents === 0) {
    throw new PermanentEventError(
      `GoodsReceived ${payload.goodsReceivedNoteNumber} has no value to book`,
    );
  }

  const bill = await payablesRepository.recordReceipt(envelope.eventId, envelope.eventType, {
    goodsReceivedNoteNumber: payload.goodsReceivedNoteNumber,
    purchaseOrderId: payload.purchaseOrderId,
    purchaseOrderNumber: payload.purchaseOrderNumber,
    receivedAt: payload.receivedAt,
    amountCents,
  });

  console.log(
    bill
      ? `Booked ${payload.goodsReceivedNoteNumber}: ${amountCents} cents owed`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startGoodsReceivedConsumer = () =>
  subscribe({ ...SUBSCRIPTIONS.goodsReceived, handle: handleGoodsReceived });

export { handleGoodsReceived, startGoodsReceivedConsumer };
