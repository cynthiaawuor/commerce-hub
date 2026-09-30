import type { Request, Response } from "express";
import * as valuationService from "../valuation.service";

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const getValuationSummary = async (req: Request, res: Response) => {
  const summary = await valuationService.getValuationSummary(
    asText(req.query["locationId"]),
  );

  res.status(200).json({ data: summary });
};

const getValuationLines = async (req: Request, res: Response) => {
  const lines = await valuationService.getValuationLines(
    asText(req.query["locationId"]),
  );

  res.status(200).json({ data: lines });
};

export { getValuationLines, getValuationSummary };
