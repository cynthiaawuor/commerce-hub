import { Router } from "express";
import * as saleController from "./controllers/sales.controller";

const salesRouter: Router = Router();

salesRouter.post("/", saleController.openSale);
salesRouter.get("/:id", saleController.getSale);

salesRouter.post("/:id/products", saleController.addProduct);
salesRouter.delete("/:id/products/:saleProductId", saleController.removeProduct);

// Actions on a sale, not fields to edit
salesRouter.post("/:id/pay", saleController.paySale);
salesRouter.post("/:id/cancel", saleController.cancelSale);

// What each register should hold, for the end-of-day count
const registersRouter: Router = Router();

registersRouter.get("/:registerCode/summary", saleController.getRegisterSummary);

export { registersRouter, salesRouter };
