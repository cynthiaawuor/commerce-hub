import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as reservationService from "../reservations.service";

type IdParams = { id: string };

const reserveStock = async (req: Request, res: Response) => {
  const reservation = await reservationService.reserveStock(
    req.body,
    getCurrentUser(req),
  );

  res.status(201).json({ message: "Stock reserved", data: reservation });
};

const listActiveReservations = async (_req: Request, res: Response) => {
  res
    .status(200)
    .json({ data: await reservationService.listActiveReservations() });
};

const getReservation = async (req: Request<IdParams>, res: Response) => {
  res
    .status(200)
    .json({ data: await reservationService.getReservation(req.params.id) });
};

const releaseReservation = async (req: Request<IdParams>, res: Response) => {
  const reservation = await reservationService.releaseReservation(req.params.id);

  res.status(200).json({ message: "Reservation released", data: reservation });
};

const commitReservation = async (req: Request<IdParams>, res: Response) => {
  const reservation = await reservationService.commitReservation(
    req.params.id,
    getCurrentUser(req),
  );

  res
    .status(200)
    .json({ message: "Reservation committed, stock removed", data: reservation });
};

export {
  commitReservation,
  getReservation,
  listActiveReservations,
  releaseReservation,
  reserveStock,
};
