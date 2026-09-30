import { db } from "../prisma/db";

const OutboxEvent = db.orm.public.OutboxEvent;

const now = () => new Date().toISOString();

//events that are waiting and whose retry time has come, oldest first
const findDue = async (limit: number) =>
  OutboxEvent.where({ status: "PENDING" })
    .where((event) => event.publishedAt.isNull())
    .where((event) => event.nextAttemptAt.lte(now()))
    .orderBy((event) => event.createdAt.asc())
    .limit(limit)
    .all();

const markPublished = async (id: string) => {
  await OutboxEvent.where({ id }).update({
    status: "PUBLISHED",
    publishedAt: new Date().toISOString(),
    lastError: null,
  });
};

//Still PENDING but not picked up again untill nextAttempAt
const recordFailure = async (
  id: string,
  attempts: number,
  error: string,
  nextAttemptAt: string,
) => {
  await OutboxEvent.where({ id }).update({
    attempts,
    lastError: error.slice(0, 500),
    nextAttemptAt,
  });
};

// Given up on. Kept, with its last error, for someone to inspect and retry.
const markDead = async (id: string, attempts: number, error: string) => {
  await OutboxEvent.where({ id }).update({
    status: "DEAD",
    attempts,
    lastError: error.slice(0, 500),
    deadAt: now(),
  });
};

const findDead = async () =>
  OutboxEvent.where({ status: "DEAD" })
    .orderBy((event) => event.deadAt.desc())
    .all();

const requeue = async (id: string) =>
  OutboxEvent.where({ id, status: "DEAD" }).update({
    status: "PENDING",
    attempts: 0,
    deadAt: null,
    nextAttemptAt: now(),
  });
export { findDue, recordFailure, markDead, findDead, requeue, markPublished };
