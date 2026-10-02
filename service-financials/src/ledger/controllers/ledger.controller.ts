import type { Request, Response } from "express";
import * as ledgerService from "../ledger.service";

type IdParams = { id: string };

// ?asOf=2026-09-30, today when left out
const getAccountBalances = async (req: Request, res: Response) => {
  res.status(200).json({ data: await ledgerService.getAccountBalances(req.query["asOf"]) });
};

const listEntries = async (req: Request, res: Response) => {
  res.status(200).json(await ledgerService.listEntries(req.query));
};

const getEntry = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json({ data: await ledgerService.getEntry(req.params.id) });
};

export { getAccountBalances, getEntry, listEntries };
