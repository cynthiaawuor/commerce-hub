import { Router } from "express";
import * as supplierController from "./suppliers.controller";

const suppliersRouter: Router = Router();

suppliersRouter.get("/", supplierController.getSuppliers);
suppliersRouter.get("/:id", supplierController.getSupplier);
suppliersRouter.post("/", supplierController.createSupplier);
suppliersRouter.put("/:id", supplierController.updateSupplier);
suppliersRouter.delete("/:id", supplierController.deleteSupplier);

export default suppliersRouter;
