import { config } from "../core/config";
import type { CurrentUser } from "../core/current-user";
import { isCheckViolation } from "../core/db-errors";
import { BadRequestError, ConflictError, NotFoundError } from "../core/http-error";
import parseAndValidate from "../core/validation";
import * as locationRepository from "../locations/locations.repository";
import * as productRepository from "../products/products.repository";
import * as stockRepository from "../stock/stock.repository";
import { ReserveStockDto } from "./dtos/reserve-stock.dto";
import * as reservationRepository from "./reservations.repository";

const SWEEP_BATCH = 100;

// A till asks to hold stock while it takes payment. Nothing leaves the shelf yet:
// available falls so no other channel can sell the same unit, and onHand is untouched
// until the sale completes.
const reserveStock = async (body: unknown, user: CurrentUser) => {
  const { obj, errors } = await parseAndValidate(ReserveStockDto, body);

  if (errors) {
    throw new BadRequestError("Unprocessable reservation", errors);
  }

  const { productId, locationId, quantity, reference } = obj!;

  if (!(await productRepository.existsById(productId))) {
    throw new NotFoundError(`Product with ID ${productId} not found`);
  }

  if (!(await locationRepository.existsById(locationId))) {
    throw new NotFoundError(`Location with ID ${locationId} not found`);
  }

  const level = await stockRepository.findLevel(productId, locationId);
  const available = level ? level.onHand - level.allocated : 0;

  if (available < quantity) {
    throw new ConflictError(
      `Only ${Math.max(available, 0)} available at this location, ${quantity} requested`,
    );
  }

  const expiresAt = new Date(Date.now() + config.reservationTtlMs).toISOString();

  try {
    const reservation = await reservationRepository.insertAndAllocate({
      productId,
      locationId,
      quantity,
      reference: reference ?? null,
      reservedBy: user.id,
      expiresAt,
    });

    if (!reservation) {
      throw new ConflictError(`No stock of this product is held at this location`);
    }

    return reservation;
  } catch (err) {
    // Another till reserved the same units between the check above and the write.
    // The database's CHECK constraint caught it, which is the point of having one.
    if (isCheckViolation(err)) {
      throw new ConflictError(
        "Another sale took the last of this stock, please try again",
      );
    }
    throw err;
  }
};

const getReservation = async (id: string) => {
  const reservation = await reservationRepository.findById(id);

  if (!reservation) {
    throw new NotFoundError(`Reservation with ID ${id} not found`);
  }

  return reservation;
};

// Only an ACTIVE reservation can be resolved. A till committing one the sweeper has
// just expired gets a 409 telling it to check availability again, rather than quietly
// selling stock that has been given back.
const assertActive = (reservation: { id: string; status: string }) => {
  if (reservation.status !== "ACTIVE") {
    throw new ConflictError(
      `Reservation ${reservation.id} is ${reservation.status.toLowerCase()} and cannot be used`,
    );
  }
};

// The cashier cancelled: the hold ends and the stock is sellable again
const releaseReservation = async (id: string) => {
  const reservation = await getReservation(id);
  assertActive(reservation);

  const released = await reservationRepository.resolve(
    id,
    "RELEASED",
    reservation.quantity,
    reservation.productId,
    reservation.locationId,
  );

  if (!released) {
    throw new ConflictError(`Reservation ${id} was resolved by someone else`);
  }

  return released;
};

// The sale completed: this is the moment stock actually leaves
const commitReservation = async (id: string, user: CurrentUser) => {
  const reservation = await getReservation(id);
  assertActive(reservation);

  const committed = await reservationRepository.commit(
    id,
    reservation.quantity,
    reservation.productId,
    reservation.locationId,
    reservation.reference,
    user.id,
  );

  if (!committed) {
    throw new ConflictError(`Reservation ${id} was resolved by someone else`);
  }

  return committed;
};

const listActiveReservations = async () => reservationRepository.findActive();

// Frees reservations no till came back for. Without this, one crashed checkout would
// hold stock out of circulation forever, and nobody would notice: onHand still looks
// right, it is available that quietly shrinks.
const sweepExpiredReservations = async () => {
  const expired = await reservationRepository.findExpired(
    new Date().toISOString(),
    SWEEP_BATCH,
  );

  let swept = 0;

  for (const reservation of expired) {
    const resolved = await reservationRepository.resolve(
      reservation.id,
      "EXPIRED",
      reservation.quantity,
      reservation.productId,
      reservation.locationId,
    );

    if (resolved) {
      swept += 1;
    }
  }

  if (swept > 0) {
    console.log(`Swept ${swept} expired reservation(s)`);
  }

  return swept;
};

export {
  commitReservation,
  getReservation,
  listActiveReservations,
  releaseReservation,
  reserveStock,
  sweepExpiredReservations,
};
