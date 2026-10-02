import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as registerDayService from "../register-days.service";

type IdParams = { id: string };

// ?status=OPEN (the default) or CLOSED
const listRegisterDays = async (req: Request, res: Response) => {
  res
    .status(200)
    .json({ data: await registerDayService.listRegisterDays(req.query["status"]) });
};

const getRegisterDay = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json({ data: await registerDayService.getRegisterDay(req.params.id) });
};

const closeRegisterDay = async (req: Request<IdParams>, res: Response) => {
  const day = await registerDayService.closeRegisterDay(
    req.params.id,
    req.body,
    getCurrentUser(req),
  );

  res.status(200).json({ message: "Register day closed", data: day });
};

export { closeRegisterDay, getRegisterDay, listRegisterDays };
