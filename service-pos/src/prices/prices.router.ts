import { Router } from "express";
import * as priceController from "./controllers/prices.controller";

const pricesRouter: Router = Router();

pricesRouter.get("/", priceController.listPrices);
// PUT: setting a price twice leaves one price, the latest
pricesRouter.put("/:sku", priceController.setPrice);

export default pricesRouter;
