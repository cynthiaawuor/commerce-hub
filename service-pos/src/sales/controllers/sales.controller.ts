import type { Request, Response } from "express";
import { getCurrentUser } from "../../core/current-user";
import * as saleService from "../sales.service";

type IdParams = { id: string };
type ProductParams = { id: string; saleProductId: string };
type RegisterParams = { registerCode: string };

const openSale = async (req: Request, res: Response) => {
  const sale = await saleService.openSale(req.body, getCurrentUser(req));

  res.status(201).json({ message: "Sale opened", data: sale });
};

const getSale = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json({ data: await saleService.getSale(req.params.id) });
};

const addProduct = async (req: Request<IdParams>, res: Response) => {
  res
    .status(201)
    .json({ data: await saleService.addProduct(req.params.id, req.body) });
};

const removeProduct = async (req: Request<ProductParams>, res: Response) => {
  res.status(200).json({
    data: await saleService.removeProduct(req.params.id, req.params.saleProductId),
  });
};

const paySale = async (req: Request<IdParams>, res: Response) => {
  const sale = await saleService.paySale(req.params.id, req.body);

  res.status(200).json({ message: "Sale completed", data: sale });
};

const cancelSale = async (req: Request<IdParams>, res: Response) => {
  const sale = await saleService.cancelSale(req.params.id);

  res.status(200).json({ message: "Sale cancelled", data: sale });
};

// ?date=2026-09-30, today when left out
const getRegisterSummary = async (req: Request<RegisterParams>, res: Response) => {
  res.status(200).json({
    data: await saleService.getRegisterSummary(req.params.registerCode, req.query["date"]),
  });
};

export {
  addProduct,
  cancelSale,
  getRegisterSummary,
  getSale,
  openSale,
  paySale,
  removeProduct,
};
