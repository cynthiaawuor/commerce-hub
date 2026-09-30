import { Router } from "express";
import * as reservationController from "./controllers/reservations.controller";

const reservationsRouter: Router = Router();

reservationsRouter.get("/", reservationController.listActiveReservations);
reservationsRouter.post("/", reservationController.reserveStock);
reservationsRouter.get("/:id", reservationController.getReservation);

// Actions on a reservation, not fields to edit
reservationsRouter.post("/:id/release", reservationController.releaseReservation);
reservationsRouter.post("/:id/commit", reservationController.commitReservation);

export default reservationsRouter;
