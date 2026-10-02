import { claimEvent } from "../events/processed-events.repository";
import { db } from "../prisma/db";

const PutawayTask = db.orm.public.PutawayTask;

type NewPutawayTask = {
  goodsReceivedNoteNumber: string;
  purchaseOrderNumber: string;
  productId: string;
  productName: string;
  quantity: number;
  suggestedShelfCode: string | null;
};

const RECENT_LIMIT = 50;

// Waiting goods oldest first, so nothing sits at the dock forever
const findPending = async () =>
  PutawayTask.where({ status: "PENDING" })
    .orderBy([(task) => task.createdAt.asc(), (task) => task.productName.asc()])
    .all();

// What was shelved most recently, for anyone checking the day's work
const findRecentlyCompleted = async () =>
  PutawayTask.where({ status: "COMPLETED" })
    .orderBy((task) => task.completedAt.desc())
    .limit(RECENT_LIMIT)
    .all();

const findById = async (id: string) => PutawayTask.where({ id }).first();

// Claiming the event and creating its tasks happen together, so a redelivered
// GoodsReceived cannot create the same tasks twice.
const insertFromGoodsReceived = async (
  eventId: string,
  eventType: string,
  tasks: NewPutawayTask[],
) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return null;
    }

    const created = [];

    for (const task of tasks) {
      created.push(await tx.orm.public.PutawayTask.create(task));
    }

    return created;
  });

type Completion = {
  taskId: string;
  shelfLocationId: string;
  shelfCode: string;
  productId: string;
  productName: string;
  quantity: number;
  completedBy: string;
};

// The task, the shelf's used space and the record of what is on the shelf are written
// together, so the warehouse map never disagrees with the finished tasks.
// Returns null when another worker completed the task first.
const complete = async (completion: Completion) =>
  db.transaction(async (tx) => {
    const task = await tx.orm.public.PutawayTask.where({
      id: completion.taskId,
      status: "PENDING",
    }).update({
      status: "COMPLETED",
      shelfCode: completion.shelfCode,
      completedBy: completion.completedBy,
      completedAt: new Date().toISOString(),
    });

    if (!task) {
      return null;
    }

    const shelf = await tx.orm.public.ShelfLocation.where({
      id: completion.shelfLocationId,
    }).first();

    // The database's capacity check rejects this if the shelf has filled up meanwhile
    await tx.orm.public.ShelfLocation.where({ id: completion.shelfLocationId }).update({
      occupiedUnits: (shelf?.occupiedUnits ?? 0) + completion.quantity,
    });

    const onShelf = await tx.orm.public.ShelfProduct.where({
      shelfLocationId: completion.shelfLocationId,
      productId: completion.productId,
    }).first();

    if (onShelf) {
      await tx.orm.public.ShelfProduct.where({ id: onShelf.id }).update({
        quantity: onShelf.quantity + completion.quantity,
      });
    } else {
      await tx.orm.public.ShelfProduct.create({
        shelfLocationId: completion.shelfLocationId,
        productId: completion.productId,
        productName: completion.productName,
        quantity: completion.quantity,
      });
    }

    return task;
  });

export {
  complete,
  findById,
  findPending,
  findRecentlyCompleted,
  insertFromGoodsReceived,
  type NewPutawayTask,
};
