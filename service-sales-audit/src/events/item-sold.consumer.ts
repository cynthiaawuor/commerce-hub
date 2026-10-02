import * as registerDayRepository from "../register-days/register-days.repository";
import { subscribe } from "./event-consumer";
import type { EventEnvelope } from "./event-publisher";
import type { ItemSoldPayload } from "./event-types";
import { PermanentEventError } from "./outbox-errors";

// Its own queue: Financials will have a separate one for the same event, so each
// service gets every sale and reads it at its own pace
const QUEUE = "sales-audit.item-sold";
const ROUTING_KEY = "pos.item-sold";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isAmount = (value: unknown): value is number =>
  Number.isInteger(value) && (value as number) >= 0;

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): ItemSoldPayload => {
  const candidate = payload as Partial<ItemSoldPayload> | null;

  if (
    !candidate ||
    !isText(candidate.saleNumber) ||
    !isText(candidate.storeCode) ||
    !isText(candidate.registerCode) ||
    !isText(candidate.cashierId) ||
    !isText(candidate.soldAt) ||
    Number.isNaN(Date.parse(candidate.soldAt)) ||
    !isAmount(candidate.totalCents) ||
    !Array.isArray(candidate.payments) ||
    !candidate.payments.every(
      (payment) =>
        (payment?.method === "CASH" || payment?.method === "CARD") && isAmount(payment.amountCents),
    )
  ) {
    throw new PermanentEventError(
      "ItemSold payload is missing its sale number, register, time, total or payments",
    );
  }

  return candidate as ItemSoldPayload;
};

const sumOf = (payload: ItemSoldPayload, method: "CASH" | "CARD") =>
  payload.payments
    .filter((payment) => payment.method === method)
    .reduce((sum, payment) => sum + payment.amountCents, 0);

// The spec's "Sales Audit listens so it can add to the expected total for Register #2"
const handleItemSold = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const day = await registerDayRepository.recordSale(envelope.eventId, envelope.eventType, {
    saleNumber: payload.saleNumber,
    storeCode: payload.storeCode,
    registerCode: payload.registerCode,
    // Midnight to midnight UTC, the same day boundary Point of Sale uses
    businessDate: new Date(payload.soldAt).toISOString().slice(0, 10),
    cashierId: payload.cashierId,
    totalCents: payload.totalCents,
    cashCents: sumOf(payload, "CASH"),
    cardCents: sumOf(payload, "CARD"),
    soldAt: payload.soldAt,
  });

  console.log(
    day
      ? `Counted ${payload.saleNumber} towards ${payload.registerCode} on ${day.businessDate}`
      : `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`,
  );
};

const startItemSoldConsumer = () =>
  subscribe({ queue: QUEUE, routingKey: ROUTING_KEY, handle: handleItemSold });

export { handleItemSold, startItemSoldConsumer };
