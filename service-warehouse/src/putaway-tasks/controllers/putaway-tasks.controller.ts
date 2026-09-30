import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as putawayTaskService from "../putaway-tasks.service";

type IdParams = { id: string };

// ?status=PENDING (the default) or COMPLETED
const listPutawayTasks = async (req: Request, res: Response) => {
  res
    .status(200)
    .json({ data: await putawayTaskService.listPutawayTasks(req.query["status"]) });
};

const completePutawayTask = async (req: Request<IdParams>, res: Response) => {
  const task = await putawayTaskService.completePutawayTask(
    req.params.id,
    req.body,
    getCurrentUser(req),
  );

  res.status(200).json({ message: "Goods put away", data: task });
};

export { completePutawayTask, listPutawayTasks };
