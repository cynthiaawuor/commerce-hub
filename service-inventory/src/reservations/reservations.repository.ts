import { db } from "../prisma/db";
import { raiseStockLowIfCrossed } from "../stock/stock.repository";

const Reservation = db.orm.public.Reservation;

type NewReservation = {
  productId: string;
  locationId: string;
  quantity: number;
  reference: string | null;
  reservedBy: string;
  expiresAt: string;
};

const findById = async (id: string) => Reservation.where({ id }).first();

const findActive = async () =>
  Reservation.where({ status: "ACTIVE" })
    .orderBy((reservation) => reservation.expiresAt.asc())
    .all();

// Reservations whose till never came back. Swept so a crashed checkout cannot hold
// stock out of circulation forever.
const findExpired = async (now: string, limit: number) =>
  Reservation.where({ status: "ACTIVE" })
    .where((reservation) => reservation.expiresAt.lte(now))
    .orderBy((reservation) => reservation.expiresAt.asc())
    .limit(limit)
    .all();

// Holding stock raises allocated; nothing physically moved, so no movement is written.
// The stock level carries a CHECK constraint keeping allocated within onHand, so a
// second till racing for the last unit fails here rather than overselling.
const insertAndAllocate = async (reservation: NewReservation) =>
  db.transaction(async (tx) => {
    const level = await tx.orm.public.StockLevel.where({
      productId: reservation.productId,
      locationId: reservation.locationId,
    }).first();

    if (!level) {
      return null;
    }

    await tx.orm.public.StockLevel.where({ id: level.id }).update({
      allocated: level.allocated + reservation.quantity,
    });

    return tx.orm.public.Reservation.create(reservation);
  });

// Giving stock back: the reservation ends and allocated falls. Only an ACTIVE
// reservation may be resolved, so a sweep and a commit cannot both count.
const resolve = async (
  id: string,
  status: "RELEASED" | "EXPIRED",
  quantity: number,
  productId: string,
  locationId: string,
) =>
  db.transaction(async (tx) => {
    const updated = await tx.orm.public.Reservation.where({
      id,
      status: "ACTIVE",
    }).update({ status, resolvedAt: new Date().toISOString() });

    if (!updated) {
      return null;
    }

    const level = await tx.orm.public.StockLevel.where({
      productId,
      locationId,
    }).first();

    if (level) {
      await tx.orm.public.StockLevel.where({ id: level.id }).update({
        allocated: Math.max(level.allocated - quantity, 0),
      });
    }

    return updated;
  });

// The sale completed: the stock leaves. allocated falls, onHand falls, and a SALE
// movement records it, all together.
const commit = async (
  id: string,
  quantity: number,
  productId: string,
  locationId: string,
  reference: string | null,
  committedBy: string,
) =>
  db.transaction(async (tx) => {
    const updated = await tx.orm.public.Reservation.where({
      id,
      status: "ACTIVE",
    }).update({ status: "COMMITTED", resolvedAt: new Date().toISOString() });

    if (!updated) {
      return null;
    }

    const level = (await tx.orm.public.StockLevel.where({
      productId,
      locationId,
    }).first())!;

    const onHand = level.onHand - quantity;

    await tx.orm.public.StockLevel.where({ id: level.id }).update({
      onHand,
      allocated: Math.max(level.allocated - quantity, 0),
    });

    await tx.orm.public.StockMovement.create({
      productId,
      locationId,
      type: "SALE",
      quantity: -quantity,
      onHandAfter: onHand,
      reason: null,
      reference,
      recordedBy: committedBy,
    });

    // The stock was already held, so available did not change when it was reserved;
    // it falls now, as the goods leave.
    await raiseStockLowIfCrossed(
      tx,
      productId,
      locationId,
      level.onHand - level.allocated,
      onHand - (level.allocated - quantity),
    );

    return updated;
  });

export {
  commit,
  findActive,
  findById,
  findExpired,
  insertAndAllocate,
  resolve,
  type NewReservation,
};
