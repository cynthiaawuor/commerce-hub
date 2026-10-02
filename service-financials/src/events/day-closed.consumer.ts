import { isDate } from "../core/dates";
import * as saleRepository from "../sales/sales.repository";
import { subscribe } from "./event-consumer";
import { PermanentEventError, type EventEnvelope } from "./event-envelope";
import { SUBSCRIPTIONS, type DayClosedPayload } from "./event-types";
import { isSignedAmount, isText, isTime } from "./payload-checks";

// A payload missing fields will be missing them on every retry
const parsePayload = (payload: unknown): DayClosedPayload => {
  const candidate = payload as Partial<DayClosedPayload> | null;

  if (
    !candidate ||
    !isText(candidate.storeCode) ||
    !isText(candidate.registerCode) ||
    !isDate(candidate.businessDate) ||
    !isSignedAmount(candidate.cashDifferenceCents) ||
    !isSignedAmount(candidate.cardDifferenceCents) ||
    !isTime(candidate.closedAt)
  ) {
    throw new PermanentEventError(
      "DayClosed payload is missing its store, register, date, differences or closing time",
    );
  }

  return candidate as DayClosedPayload;
};

// The spec's "records the shortage as a Cash over / short expense"
const handleDayClosed = async (envelope: EventEnvelope) => {
  const payload = parsePayload(envelope.payload);

  const result = await saleRepository.recordTillClose(envelope.eventId, envelope.eventType, {
    storeCode: payload.storeCode,
    registerCode: payload.registerCode,
    businessDate: payload.businessDate,
    cashDifferenceCents: payload.cashDifferenceCents,
    cardDifferenceCents: payload.cardDifferenceCents,
    explanation: isText(payload.explanation) ? payload.explanation : null,
    closedAt: payload.closedAt,
  });

  const till = `${payload.registerCode} on ${payload.businessDate}`;

  console.log(
    !result
      ? `Ignored a repeat delivery of ${envelope.eventType} ${envelope.eventId}`
      : result.posted
        ? `Booked the till difference for ${till}`
        : `${till} balanced; nothing to book`,
  );
};

const startDayClosedConsumer = () =>
  subscribe({ ...SUBSCRIPTIONS.dayClosed, handle: handleDayClosed });

export { handleDayClosed, startDayClosedConsumer };
