import { config } from "../core/config";
import { routingKeyFor } from "./event-types";
import * as eventPublisher from "./event-publisher";
import { BrokerUnavailableError, PermanentEventError } from "./outbox-errors";
import { nextRetryDelayMs } from "./outbox-retry";
import * as outboxRepository from "./outbox.repository";

const BATCH_SIZE = 20;

let timer: NodeJS.Timeout | null = null;
let running = false;

// Publishes whatever the outbox holds. Failures leave the row unpublished, so the next
// pass retries it: a broker outage delays events but never loses them.
type OutboxRow = Awaited<ReturnType<typeof outboxRepository.findDue>>[number];

// Turns a stored row into what subscribers receive. A payload that is not valid JSON
// will never become valid, so it is a permanent failure.
const toEnvelope = (event: OutboxRow) => {
  let payload: unknown;

  try {
    payload = JSON.parse(event.payload);
  } catch {
    throw new PermanentEventError("Payload is not valid JSON");
  }

  if (payload === null || typeof payload !== "object") {
    throw new PermanentEventError("Payload must be a JSON object");
  }

  return {
    eventId: event.id,
    eventType: event.eventType,
    aggregateId: event.aggregateId,
    occurredAt: event.createdAt,
    payload,
  };
};

// Publishes whatever is due. Three outcomes on failure:
//   broker unreachable -> stop the pass, don't blame the event, try again next tick
//   event is broken, or has failed too often -> mark DEAD and move on
//   anything else -> back off this event and move on
// "Move on" is the point: one bad event must never hold up the ones behind it.
const publishPendingEvents = async () => {
  const events = await outboxRepository.findDue(BATCH_SIZE);

  for (const event of events) {
    try {
      await eventPublisher.publish(
        routingKeyFor(event.eventType),
        toEnvelope(event),
      );
      await outboxRepository.markPublished(event.id);
      console.log(`Published ${event.eventType} ${event.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (err instanceof BrokerUnavailableError) {
        console.error(`Outbox paused: ${message}`);
        return;
      }

      const attempts = event.attempts + 1;

      if (
        err instanceof PermanentEventError ||
        attempts >= config.outboxMaxAttempts
      ) {
        await outboxRepository.markDead(event.id, attempts, message);
        console.error(
          `Dead-lettered ${event.eventType} ${event.id} after ${attempts} attempt(s): ${message}`,
        );
        continue;
      }

      const delayMs = nextRetryDelayMs(
        attempts,
        config.outboxRetryBaseMs,
        config.outboxRetryMaxMs,
      );

      await outboxRepository.recordFailure(
        event.id,
        attempts,
        message,
        new Date(Date.now() + delayMs).toISOString(),
      );

      console.error(
        `Could not publish ${event.eventType} ${event.id} (attempt ${attempts}), retrying in ${delayMs}ms: ${message}`,
      );
    }
  }
};

// Overlapping passes would publish the same row twice, so a pass is skipped while
// the previous one is still running.
const tick = async () => {
  if (running) {
    return;
  }

  running = true;

  try {
    await publishPendingEvents();
  } catch (err) {
    console.error("Outbox worker pass failed:", err);
  } finally {
    running = false;
  }
};

const startOutboxWorker = () => {
  timer = setInterval(tick, config.outboxPollMs);
  // Don't hold the process open just for the poll timer
  timer.unref();
  console.log(`Outbox worker polling every ${config.outboxPollMs}ms`);
};

const stopOutboxWorker = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  await eventPublisher.close();
};

export { publishPendingEvents, startOutboxWorker, stopOutboxWorker };
