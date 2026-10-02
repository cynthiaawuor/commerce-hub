import { Router } from "express";
import * as ledgerController from "./controllers/ledger.controller";

// Read-only: entries only ever reach the ledger from events and supplier payments
const ledgerRouter: Router = Router();

ledgerRouter.get("/accounts", ledgerController.getAccountBalances);
ledgerRouter.get("/entries", ledgerController.listEntries);
ledgerRouter.get("/entries/:id", ledgerController.getEntry);

export default ledgerRouter;
