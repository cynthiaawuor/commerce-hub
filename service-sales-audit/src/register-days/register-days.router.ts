import { Router } from "express";
import * as registerDayController from "./controllers/register-days.controller";

const registerDaysRouter: Router = Router();

registerDaysRouter.get("/", registerDayController.listRegisterDays);
registerDaysRouter.get("/:id", registerDayController.getRegisterDay);

// An action on the day, not a field to edit
registerDaysRouter.post("/:id/close", registerDayController.closeRegisterDay);

export default registerDaysRouter;
