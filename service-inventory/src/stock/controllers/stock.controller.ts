import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import { BadRequestError } from "../../core/http-error";
import { toStockResponse } from "../stock.mapper";
import * as stockService from "../stock.service";

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

// Stock is always asked for by product or by location, never as one long list of
// everything: "how much of X do we have" and "what is at Y" are the real questions.
const getStock = async (req: Request, res: Response) => {
  const productId = asText(req.query["productId"]);
  const locationId = asText(req.query["locationId"]);

  if (productId) {
    const levels = await stockService.getStockByProduct(productId);
    res.status(200).json({ data: levels.map(toStockResponse) });
    return;
  }

  if (locationId) {
    const levels = await stockService.getStockByLocation(locationId);
    res.status(200).json({ data: levels.map(toStockResponse) });
    return;
  }

  throw new BadRequestError("Provide either productId or locationId");
};

const getMovements = async (req: Request, res: Response) => {
  const productId = asText(req.query["productId"]);

  if (!productId) {
    throw new BadRequestError("Provide productId");
  }

  const limitValue = Number(req.query["limit"] ?? 50);
  const limit = Number.isInteger(limitValue) && limitValue > 0 && limitValue <= 200
    ? limitValue
    : 50;

  const movements = await stockService.getMovements(
    productId,
    asText(req.query["locationId"]),
    limit,
  );

  res.status(200).json({ data: movements });
};

const adjustStock = async (req: Request, res: Response) => {
  const level = await stockService.adjustStock(req.body, getCurrentUser(req));

  res.status(201).json({
    message: "Stock adjustment recorded",
    data: toStockResponse(level),
  });
};

export { adjustStock, getMovements, getStock };
