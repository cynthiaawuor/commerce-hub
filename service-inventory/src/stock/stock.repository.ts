import { isUniqueViolation } from "../core/db-errors";
import { hasCrossedReorderPoint } from "./stock-low";
import { claimEvent } from "../events/processed-events.repository";
import { STOCK_LOW } from "../events/event-types";
import { db } from "../prisma/db";

const StockLevel = db.orm.public.StockLevel;
const StockMovement = db.orm.public.StockMovement;

// The context db.transaction() hands to its callback
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type MovementType =
  "RECEIPT" | "SALE" | "RETURN" | "ADJUSTMENT" | "TRANSFER_IN" | "TRANSFER_OUT";

type Movement = {
  productId: string;
  locationId: string;
  type: MovementType;
  // Positive adds stock, negative removes it
  quantity: number;
  reason: string | null;
  reference: string | null;
  recordedBy: string;
};

const findLevel = async (productId: string, locationId: string) =>
  StockLevel.where({ productId, locationId }).first();

// Every location holding this product. A location with no row has none of it.
const findLevelsByProduct = async (productId: string) =>
  StockLevel.where({ productId })
    .include("location", (location) => location.select("id", "code", "name"))
    .all();

const findLevelsByLocation = async (locationId: string) =>
  StockLevel.where({ locationId })
    .include("product", (product) => product.select("id", "sku", "name"))
    .all();

// Newest first: the recent history is what anyone investigating a number wants
const findMovements = async (
  productId: string,
  locationId: string | undefined,
  limit: number,
) => {
  let movements = StockMovement.where({ productId });

  if (locationId) {
    movements = movements.where({ locationId });
  }

  return movements
    .orderBy([(m) => m.createdAt.desc(), (m) => m.id.desc()])
    .limit(limit)
    .all();
};

// Writes StockLow to the outbox when this change took available products past the product's
// reorder point. Same transaction as the stock change, so Procurement is never told
// about a shortage that did not happen, and never misses one that did.
const raiseStockLowIfCrossed = async (
  tx: Tx,
  productId: string,
  locationId: string,
  availableBefore: number,
  availableAfter: number,
) => {
  const product = await tx.orm.public.Product.where({ id: productId })
    .select("name", "reorderPoint", "reorderQuantity")
    .first();

  if (!product) {
    return;
  }

  if (
    !hasCrossedReorderPoint(
      availableBefore,
      availableAfter,
      product.reorderPoint,
    )
  ) {
    return;
  }

  const location = await tx.orm.public.Location.where({ id: locationId })
    .select("code")
    .first();

  await tx.orm.public.OutboxEvent.create({
    eventType: STOCK_LOW,
    aggregateId: productId,
    payload: JSON.stringify({
      productId,
      productName: product.name,
      // Other services quote codes rather than our ids
      locationId: location?.code ?? locationId,
      quantityAvailable: Math.max(availableAfter, 0),
      reorderPoint: product.reorderPoint,
      reorderQuantity: product.reorderQuantity,
    }),
  });
};

// Stock levels are created when stock first arrives at a location, not up front for
// every product everywhere: a missing row means none of that product is there.
const findOrCreateLevel = async (
  tx: Tx,
  productId: string,
  locationId: string,
) => {
  const existing = await tx.orm.public.StockLevel.where({
    productId,
    locationId,
  }).first();

  if (existing) {
    return existing;
  }

  try {
    return await tx.orm.public.StockLevel.create({ productId, locationId });
  } catch (err) {
    // Two movements for the same pair can race to create the row; the loser reads it
    if (isUniqueViolation(err)) {
      return (await tx.orm.public.StockLevel.where({
        productId,
        locationId,
      }).first())!;
    }
    throw err;
  }
};

// The level and the movement explaining it are written together, so the ledger always
// adds up to the running total.
const applyMovement = async (movement: Movement) =>
  db.transaction(async (tx) => {
    const level = await findOrCreateLevel(
      tx,
      movement.productId,
      movement.locationId,
    );

    const onHand = level.onHand + movement.quantity;

    const updated = await tx.orm.public.StockLevel.where({
      id: level.id,
    }).update({ onHand });

    await tx.orm.public.StockMovement.create({
      productId: movement.productId,
      locationId: movement.locationId,
      type: movement.type,
      quantity: movement.quantity,
      onHandAfter: onHand,
      reason: movement.reason,
      reference: movement.reference,
      recordedBy: movement.recordedBy,
    });

    await raiseStockLowIfCrossed(
      tx,
      movement.productId,
      movement.locationId,
      level.onHand - level.allocated,
      onHand - level.allocated,
    );

    return updated!;
  });

export {
  applyMovement,
  raiseStockLowIfCrossed,
  findLevel,
  findLevelsByLocation,
  findLevelsByProduct,
  findMovements,
  type Movement,
  type MovementType,
};

type OnOrderLine = {
  productId: string;
  locationId: string;
  quantity: number;
};

// An approved purchase order means stock is coming: quantity on order rises, nothing
// physically moved, so no movement is recorded. Claiming the event and changing the
// quantities happen together, so a redelivery cannot count the order twice.
const applyOnOrder = async (
  eventId: string,
  eventType: string,
  lines: OnOrderLine[],
) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return false;
    }

    for (const line of lines) {
      const level = await findOrCreateLevel(
        tx,
        line.productId,
        line.locationId,
      );

      await tx.orm.public.StockLevel.where({ id: level.id }).update({
        onOrder: Math.max(level.onOrder + line.quantity, 0),
      });
    }

    return true;
  });

type ReceiptLine = {
  productId: string;
  quantity: number;
  unitCostCents: number;
};

// Weighted average: the new cost is what the stock we now hold cost on average.
// Rounded to whole cents, since money is never fractional here.
const weightedAverage = (
  heldQuantity: number,
  heldCostCents: number,
  arrivedQuantity: number,
  arrivedCostCents: number,
) => {
  const total = heldQuantity + arrivedQuantity;

  if (total <= 0) {
    return arrivedCostCents;
  }

  return Math.round(
    (heldQuantity * heldCostCents + arrivedQuantity * arrivedCostCents) / total,
  );
};

// Goods have arrived: stock on hand rises, what was on order falls, a RECEIPT movement
// records it, and the product's average cost is recalculated. A receipt is the only
// moment Inventory learns what stock cost.
const applyReceipt = async (
  eventId: string,
  eventType: string,
  locationId: string,
  reference: string,
  recordedBy: string,
  lines: ReceiptLine[],
) =>
  db.transaction(async (tx) => {
    if (!(await claimEvent(tx, eventId, eventType))) {
      return false;
    }

    for (const line of lines) {
      const level = await findOrCreateLevel(tx, line.productId, locationId);
      const onHand = level.onHand + line.quantity;

      await tx.orm.public.StockLevel.where({ id: level.id }).update({
        onHand,
        // Never below zero: receiving more than was ordered still only cancels
        // what was outstanding
        onOrder: Math.max(level.onOrder - line.quantity, 0),
      });

      await tx.orm.public.StockMovement.create({
        productId: line.productId,
        locationId,
        type: "RECEIPT",
        quantity: line.quantity,
        onHandAfter: onHand,
        reason: null,
        reference,
        recordedBy,
      });

      // Cost is averaged across everything held, not just this location
      const held = await tx.orm.public.StockLevel.where({
        productId: line.productId,
      })
        .select("onHand")
        .all();

      const heldQuantity =
        held.reduce((total, row) => total + row.onHand, 0) - line.quantity;

      const product = await tx.orm.public.Product.where({ id: line.productId })
        .select("averageCostCents")
        .first();

      await tx.orm.public.Product.where({ id: line.productId }).update({
        averageCostCents: weightedAverage(
          Math.max(heldQuantity, 0),
          product?.averageCostCents ?? 0,
          line.quantity,
          line.unitCostCents,
        ),
      });
    }

    return true;
  });

export { applyOnOrder, applyReceipt, weightedAverage };
