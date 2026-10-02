// Financials only listens, so it needs the envelope and the exchange name but none of
// the publishing machinery the other services carry.

// The one durable topic exchange every service publishes to
const EXCHANGE = "commerce.events";

type EventEnvelope = {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: string;
  payload: unknown;
};

// The event itself is broken (bad JSON, missing fields). It will fail identically on
// every retry, so it is dead-lettered at once instead of being retried.
class PermanentEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentEventError";
  }
}

export { EXCHANGE, PermanentEventError, type EventEnvelope };
