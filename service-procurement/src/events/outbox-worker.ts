import { config } from "../core/config";
import { routingKeyFor } from "./event-types";
import * as eventPublisher from "./event-publisher";
import * as outboxRepository from "./outbox.repository";

const BATCH_SIZE = 20;

let timer: NodeJS.Timeout | null = null;
let running = false;

// Publishes whatever the outbox holds. Failures leave the row unpublished, so the next
// pass retries it: a broker outage delays events but never loses them.
const publishPendingEvents = async () => {
  const events = await outboxRepository.findUnpublished(BATCH_SIZE);

  for (const event of events) {
    try {
      await eventPublisher.publish(routingKeyFor(event.eventType), {
        eventId: event.id,
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        occurredAt: event.createdAt,
        payload: JSON.parse(event.payload),
      });

      await outboxRepository.markPublished(event.id);
      console.log(`Published ${event.eventType} ${event.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await outboxRepository.markFailed(event.id, event.attempts, message);
      console.error(`Could not publish ${event.eventType} ${event.id}: ${message}`);
      // The broker is probably down; stop this pass and try again on the next tick
      return;
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
