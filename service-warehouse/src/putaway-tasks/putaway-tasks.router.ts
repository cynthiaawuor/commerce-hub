import { Router } from "express";
import * as putawayTaskController from "./controllers/putaway-tasks.controller";

const putawayTasksRouter: Router = Router();

putawayTasksRouter.get("/", putawayTaskController.listPutawayTasks);
putawayTasksRouter.post("/:id/complete", putawayTaskController.completePutawayTask);

export default putawayTasksRouter;
