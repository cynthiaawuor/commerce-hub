import { Router } from "express";
import * as payablesController from "./controllers/payables.controller";

const payablesRouter: Router = Router();

payablesRouter.get("/", payablesController.listBills);
// Must come before "/:id", or Express would read "suppliers" as a bill id
payablesRouter.get("/suppliers", payablesController.listSupplierBalances);
payablesRouter.get("/:id", payablesController.getBill);
payablesRouter.post("/:id/payments", payablesController.recordPayment);

const commitmentsRouter: Router = Router();

commitmentsRouter.get("/", payablesController.listOpenCommitments);

export { commitmentsRouter, payablesRouter };
