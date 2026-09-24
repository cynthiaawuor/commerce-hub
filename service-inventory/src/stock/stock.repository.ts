import { isUniqueViolation } from "../core/db-errors";
import { db } from "../prisma/db";

const StockLevel = db.orm.public.StockLevel;
const StockMovement = db.orm.public.StockMovement;

// The context db.transaction() hands to its callback
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type MovementType =
  | "RECEIPT"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

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

    return updated!;
  });

export {
  applyMovement,
  findLevel,
  findLevelsByLocation,
  findLevelsByProduct,
  findMovements,
  type Movement,
  type MovementType,
};
