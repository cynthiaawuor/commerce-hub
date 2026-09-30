import type { Request, Response } from "express";
import * as expectedDeliveryService from "../expected-deliveries.service";

type IdParams = { id: string };

// What the dock is waiting for
const listOpenDeliveries = async (_req: Request, res: Response) => {
  res.status(200).json({ data: await expectedDeliveryService.listOpenDeliveries() });
};

const getExpectedDelivery = async (req: Request<IdParams>, res: Response) => {
  res
    .status(200)
    .json({ data: await expectedDeliveryService.getExpectedDelivery(req.params.id) });
};

export { getExpectedDelivery, listOpenDeliveries };
