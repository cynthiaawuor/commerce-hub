import { Router } from "express";
import type { Request, Response } from "express";
import * as outboxService from "./outbox.service";

// Operational endpoints: events the service gave up on, and a way to send them again
const outboxRouter: Router = Router();

outboxRouter.get("/dead", async (_req: Request, res: Response) => {
  res.status(200).json({ data: await outboxService.listDeadEvents() });
});

outboxRouter.post(
  "/:id/retry",
  async (req: Request<{ id: string }>, res: Response) => {
    const event = await outboxService.retryDeadEvent(req.params.id);
    res
      .status(200)
      .json({ message: "Event requeued for publishing", data: event });
  },
);

export default outboxRouter;
