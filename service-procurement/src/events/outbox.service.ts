import { NotFoundError } from "../core/http-error";
import * as outboxRepository from "./outbox.repository";

const listDeadEvents = () => outboxRepository.findDead();

// Once the cause is fixed (a subscriber repaired, a payload corrected), put the event
// back in line with a fresh set of attempts
const retryDeadEvent = async (id: string) => {
  const event = await outboxRepository.requeue(id);

  if (!event) {
    throw new NotFoundError(`No dead-lettered outbox event with ID ${id}`);
  }

  return event;
};

export { listDeadEvents, retryDeadEvent };
