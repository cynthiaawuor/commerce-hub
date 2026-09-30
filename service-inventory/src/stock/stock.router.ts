import { Router } from "express";
import * as stockController from "./controllers/stock.controller";

const stockRouter: Router = Router();

stockRouter.get("/", stockController.getStock);
stockRouter.get("/movements", stockController.getMovements);
stockRouter.post("/adjustments", stockController.adjustStock);

export default stockRouter;
