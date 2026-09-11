import { Router } from "express";
import type { Request, Response } from "express";
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  getSuppliers,
  updateSupplier,
} from "./suppliers.service";

const suppliersRouter: Router = Router();

suppliersRouter.get("/", async (_req: Request, res: Response) => {
  res.status(200).json(await getSuppliers());
});

suppliersRouter.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const supplier = await getSupplier(`${id}`);
  res.status(supplier ? 200 : 404).json(supplier);
});

suppliersRouter.post("/", async (req: Request, res: Response) => {
  const createdSupplier = await createSupplier(req.body);
  res
    .status(201)
    .json({ message: "Supplier created successfully", data: createdSupplier });
});

suppliersRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const createdSupplier = await updateSupplier(`${id}`, req.body);
  res
    .status(202)
    .json({ message: "Supplier updated successfully", data: createdSupplier });
});

suppliersRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await deleteSupplier(`${id}`);
  res.json({
    message: deleted
      ? `Supplier with ID ${id} deleted successfully`
      : "Failed to delete supplier",
  });
});

export default suppliersRouter;
