import { isUniqueViolation } from "../core/db-errors";
import { db } from "../prisma/db";

// The context db.transaction() hands to its callback
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Records that an event has been handled, in the same transaction as the change it
// caused. RabbitMQ delivers at least once, so without this a redelivered GoodsReceived
// would add the same stock twice.
//
// Returns false when the event was already handled, so the caller can stop.
const claimEvent = async (tx: Tx, eventId: string, eventType: string) => {
  try {
    await tx.orm.public.ProcessedEvent.create({ id: eventId, eventType });
    return true;
  } catch (err) {
    // The id is the primary key: a duplicate means another delivery got here first
    if (isUniqueViolation(err)) {
      return false;
    }
    throw err;
  }
};

const hasProcessed = async (eventId: string) =>
  (await db.orm.public.ProcessedEvent.where({ id: eventId }).first()) !== null;

export { claimEvent, hasProcessed };
