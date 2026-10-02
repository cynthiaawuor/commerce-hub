import { Router } from "express";
import * as reportController from "./controllers/reports.controller";

// Read-only, as the spec asks: other services and the Finance Portal read these
const reportsRouter: Router = Router();

reportsRouter.get("/profit-and-loss", reportController.getProfitAndLoss);
reportsRouter.get("/balance-sheet", reportController.getBalanceSheet);
reportsRouter.get("/profitability", reportController.getProfitability);

export default reportsRouter;
