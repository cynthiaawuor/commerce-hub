import { Router } from "express";
import * as expectedDeliveryController from "./controllers/expected-deliveries.controller";

const expectedDeliveriesRouter: Router = Router();

expectedDeliveriesRouter.get("/", expectedDeliveryController.listOpenDeliveries);
expectedDeliveriesRouter.get("/:id", expectedDeliveryController.getExpectedDelivery);

export default expectedDeliveriesRouter;
