import type { CurrentUser } from "../core/current-user";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import type { GoodsReceivedPayload } from "../events/event-types";
import * as shelfLocationRepository from "../shelf-locations/shelf-locations.repository";
import { CompletePutawayTaskDto } from "./dtos/complete-putaway-task.dto";
import * as putawayTaskRepository from "./putaway-tasks.repository";
import { suggestShelf, type ShelfOption } from "./suggest-shelf";

// Goods have been received: one task per product, each with a suggested shelf.
// Space is promised as tasks are planned, so two tasks are never sent to the same
// last few units of room.
const planPutaway = async (
  eventId: string,
  eventType: string,
  note: GoodsReceivedPayload,
) => {
  const [shelves, pending] = await Promise.all([
    shelfLocationRepository.findAll(),
    putawayTaskRepository.findPending(),
  ]);

  // Room already promised to goods still waiting at the dock
  const promised = new Map<string, number>();
  for (const task of pending) {
    if (task.suggestedShelfCode) {
      promised.set(
        task.suggestedShelfCode,
        (promised.get(task.suggestedShelfCode) ?? 0) + task.quantity,
      );
    }
  }

  const tasks: putawayTaskRepository.NewPutawayTask[] = [];

  for (const product of note.products) {
    const options: ShelfOption[] = shelves.map((shelf) => ({
      code: shelf.code,
      distanceFromDock: shelf.distanceFromDock,
      freeUnits:
        shelf.capacityUnits - shelf.occupiedUnits - (promised.get(shelf.code) ?? 0),
      holdsProduct: shelf.products.some((p) => p.productId === product.productId),
    }));

    const suggestedShelfCode = suggestShelf(options, product.quantityReceived);

    if (suggestedShelfCode) {
      promised.set(
        suggestedShelfCode,
        (promised.get(suggestedShelfCode) ?? 0) + product.quantityReceived,
      );
    }

    tasks.push({
      goodsReceivedNoteNumber: note.goodsReceivedNoteNumber,
      purchaseOrderNumber: note.purchaseOrderNumber,
      productId: product.productId,
      productName: product.productName ?? product.productId,
      quantity: product.quantityReceived,
      suggestedShelfCode,
    });
  }

  return putawayTaskRepository.insertFromGoodsReceived(eventId, eventType, tasks);
};

const listPutawayTasks = async (status: unknown) => {
  if (status === undefined || status === "PENDING") {
    return putawayTaskRepository.findPending();
  }

  if (status === "COMPLETED") {
    return putawayTaskRepository.findRecentlyCompleted();
  }

  throw new BadRequestError("Invalid filter", {
    status: ["must be PENDING or COMPLETED"],
  });
};

// The worker has put the goods on a shelf
const completePutawayTask = async (id: string, body: unknown, user: CurrentUser) => {
  const { obj, errors } = await parseAndValidate(CompletePutawayTaskDto, body);

  if (errors) {
    throw new BadRequestError("Invalid putaway", errors);
  }

  const task = await putawayTaskRepository.findById(id);

  if (!task) {
    throw new NotFoundError(`Putaway task ${id} not found`);
  }

  if (task.status !== "PENDING") {
    throw new ConflictError(`${task.productName} has already been put away`);
  }

  const shelfCode = obj!.shelfCode ?? task.suggestedShelfCode;

  if (!shelfCode) {
    throw new BadRequestError("Choose a shelf", {
      shelfCode: ["no shelf had room when the goods arrived, so one must be chosen"],
    });
  }

  const shelf = await shelfLocationRepository.findByCode(shelfCode);

  if (!shelf) {
    throw new NotFoundError(`Shelf ${shelfCode} not found`);
  }

  const freeUnits = shelf.capacityUnits - shelf.occupiedUnits;

  if (freeUnits < task.quantity) {
    throw new ConflictError(
      `Shelf ${shelf.code} has room for ${freeUnits} more, not ${task.quantity}`,
    );
  }

  const completed = await putawayTaskRepository.complete({
    taskId: task.id,
    shelfLocationId: shelf.id,
    shelfCode: shelf.code,
    productId: task.productId,
    productName: task.productName,
    quantity: task.quantity,
    completedBy: user.id,
  });

  if (!completed) {
    throw new ConflictError(`${task.productName} has already been put away`);
  }

  return completed;
};

export { completePutawayTask, listPutawayTasks, planPutaway };
