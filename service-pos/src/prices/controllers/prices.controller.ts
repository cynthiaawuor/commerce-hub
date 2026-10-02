import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as priceService from "../prices.service";

type SkuParams = { sku: string };

const listPrices = async (_req: Request, res: Response) => {
  res.status(200).json({ data: await priceService.listPrices() });
};

const setPrice = async (req: Request<SkuParams>, res: Response) => {
  const price = await priceService.setPrice(req.params.sku, req.body, getCurrentUser(req));

  res.status(200).json({ message: "Price saved", data: price });
};

export { listPrices, setPrice };
