import type { Request, Response } from "express";
import * as reportService from "../reports.service";

const getProfitAndLoss = async (req: Request, res: Response) => {
  res.status(200).json({
    data: await reportService.getProfitAndLoss(req.query["from"], req.query["to"]),
  });
};

const getBalanceSheet = async (req: Request, res: Response) => {
  res.status(200).json({ data: await reportService.getBalanceSheet(req.query["asOf"]) });
};

const getProfitability = async (req: Request, res: Response) => {
  res.status(200).json({
    data: await reportService.getProfitability(
      req.query["by"],
      req.query["from"],
      req.query["to"],
    ),
  });
};

export { getBalanceSheet, getProfitAndLoss, getProfitability };
