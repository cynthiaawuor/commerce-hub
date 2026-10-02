import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as payablesService from "../payables.service";

type IdParams = { id: string };

// ?status=OPEN (the default), PAID or ALL
const listBills = async (req: Request, res: Response) => {
  res.status(200).json({ data: await payablesService.listBills(req.query["status"]) });
};

const listSupplierBalances = async (_req: Request, res: Response) => {
  res.status(200).json({ data: await payablesService.listSupplierBalances() });
};

const getBill = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json({ data: await payablesService.getBill(req.params.id) });
};

const recordPayment = async (req: Request<IdParams>, res: Response) => {
  const bill = await payablesService.recordPayment(req.params.id, req.body, getCurrentUser(req));

  res.status(201).json({ message: "Payment recorded", data: bill });
};

const listOpenCommitments = async (_req: Request, res: Response) => {
  res.status(200).json({ data: await payablesService.listOpenCommitments() });
};

export { getBill, listBills, listOpenCommitments, listSupplierBalances, recordPayment };
