import type { Request, Response } from "express";
import * as supplierService from "./suppliers.service";

type IdParams = { id: string };

// Controllers only translate HTTP to service calls: read params and body, pick the status code.
// Errors thrown by the service are passed on to the error middleware by Express 5:
// manual try-catch blocks or next(err) calls are not needed.

const getSuppliers = async (_req: Request, res: Response) => {
  res.status(200).json(await supplierService.getSuppliers());
};

const getSupplier = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json(await supplierService.getSupplier(req.params.id));
};

const createSupplier = async (req: Request, res: Response) => {
  const createdSupplier = await supplierService.createSupplier(req.body);

  res
    .status(201)
    .json({ message: "Supplier created successfully", data: createdSupplier });
};

const updateSupplier = async (req: Request<IdParams>, res: Response) => {
  const updatedSupplier = await supplierService.updateSupplier(
    req.params.id,
    req.body,
  );

  res
    .status(200)
    .json({ message: "Supplier updated successfully", data: updatedSupplier });
};

const deleteSupplier = async (req: Request<IdParams>, res: Response) => {
  const { id } = req.params;

  await supplierService.deleteSupplier(id);

  res
    .status(200)
    .json({ message: `Supplier with ID ${id} deleted successfully` });
};

export {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
