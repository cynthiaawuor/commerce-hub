import * as saleService from "../sales/sales.service";
import { subscribe } from "./event-consumer";
import { PermanentEventError, type EventEnvelope } from "./event-envelope";
import { SUBSCRIPTIONS, type ItemSoldPayload } from "./event-types";
import { isAmount, isText, isTime } from "./payload-checks";

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): ItemSoldPayload => {
  const candidate = payload as Partial<ItemSoldPayload> | null;

  if (
    !candidate ||
    !isText(candidate.saleNumber) ||
    !isText(candidate.storeCode) ||
    !isText(candidate.registerCode) ||
    !isTime(candidate.soldAt) ||
    !isAmount(candidate.totalCents) ||
    !isAmount(candidate.taxCents) ||
    !Array.isArray(candidate.products) ||
    candidate.products.length === 0 ||
    !candidate.products.every(
      (product) =>
        isText(product?.productId) &&
        isText(product?.sku) &&
        isText(product?.productName) &&
        isAmount(product?.quantity) &&
        isAmount(product?.totalCents),
    ) ||
    !Array.isArray(candidate.payments) ||
    !candidate.payments.every(
      (payment) =>
        (payment?.method === "CASH" || payment?.method === "CARD") && isAmount(payment.amountCents),
    )
  ) {
    throw new PermanentEventError(
      "ItemSold payload is missing its sale number, store, time, totals, products or payments",
    );
  }

  const sale = candidate as ItemSoldPayload;
  const paidCents = sale.payments.reduce((sum, payment) => sum + payment.amountCents, 0);

  // Payments are net of change, so they must add up to the total. If they do not, the
  // entry would not balance, and no retry will change that.
  if (paidCents !== sale.totalCents || sale.taxCents > sale.totalCents || sale.totalCents === 0) {
    throw new PermanentEventError(
      `ItemSold ${sale.saleNumber} does not add up: total ${sale.totalCents}, paid ${paidCents}, VAT ${sale.taxCents}`,
    );
  }

  return sale;
};

// The spec's "recognise revenue, and Dr Cost of goods sold / Cr Inventory"
const handleItemSold = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const sale = await saleService.bookSale(envelope.eventId, envelope.eventType, payload);

  console.log(
    sale
      ? `Booked ${payload.saleNumber}: ${payload.totalCents} cents at ${payload.registerCode}`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startItemSoldConsumer = () =>
  subscribe({ ...SUBSCRIPTIONS.itemSold, handle: handleItemSold });

export { handleItemSold, startItemSoldConsumer };
