import { Router } from "express";
import * as valuationController from "./controllers/valuation.controller";

const valuationRouter: Router = Router();

valuationRouter.get("/", valuationController.getValuationSummary);
valuationRouter.get("/lines", valuationController.getValuationLines);

export default valuationRouter;
