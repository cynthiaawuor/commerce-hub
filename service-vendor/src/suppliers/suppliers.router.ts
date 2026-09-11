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
  res.status(200).json(await getSupplier(`${id}`));
});

suppliersRouter.post("/", async (req: Request, res: Response) => {
  const createdSupplier = await createSupplier(req.body);
  res
    .status(201)
    .json({ message: "Supplier created successfully", data: createdSupplier });
});

suppliersRouter.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedSupplier = await updateSupplier(`${id}`, req.body);
  res
    .status(200)
    .json({ message: "Supplier updated successfully", data: updatedSupplier });
});

suppliersRouter.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteSupplier(`${id}`);
  res.json({ message: `Supplier with ID ${id} deleted successfully` });
});

export default suppliersRouter;
