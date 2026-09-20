import { db } from "../prisma/db";

const OutboxEvent = db.orm.public.OutboxEvent;

// Oldest first, so events reach subscribers in the order they happened
const findUnpublished = async (limit: number) =>
  OutboxEvent.where((event) => event.publishedAt.isNull())
    .orderBy((event) => event.createdAt.asc())
    .limit(limit)
    .all();

const markPublished = async (id: string) => {
  await OutboxEvent.where({ id }).update({
    publishedAt: new Date().toISOString(),
  });
};

// Leaves publishedAt null so the row is retried on the next pass
const markFailed = async (id: string, attempts: number, error: string) => {
  await OutboxEvent.where({ id }).update({
    attempts: attempts + 1,
    lastError: error.slice(0, 500),
  });
};

export { findUnpublished, markFailed, markPublished };
