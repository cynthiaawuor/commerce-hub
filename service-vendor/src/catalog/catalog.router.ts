import { Router } from "express";
import type { Request, Response } from "express";
import {
  createCatalogItem,
  deleteCatalogItem,
  getCatalogItem,
  getCatalogItems,
  updateCatalogItem,
} from "./catalog.service";

// Mounted under /suppliers/:supplierId/catalog-items; mergeParams exposes :supplierId here.
const catalogRouter: Router = Router({ mergeParams: true });

catalogRouter.get("/", async (req: Request, res: Response) => {
  const { supplierId } = req.params;
  res.status(200).json(await getCatalogItems(`${supplierId}`));
});

catalogRouter.get("/:id", async (req: Request, res: Response) => {
  const { supplierId, id } = req.params;
  res.status(200).json(await getCatalogItem(`${supplierId}`, `${id}`));
});

catalogRouter.post("/", async (req: Request, res: Response) => {
  const { supplierId } = req.params;
  const createdCatalogItem = await createCatalogItem(`${supplierId}`, req.body);
  res
    .status(201)
    .json({ message: "Catalog item created successfully", data: createdCatalogItem });
});

catalogRouter.put("/:id", async (req: Request, res: Response) => {
  const { supplierId, id } = req.params;
  const updatedCatalogItem = await updateCatalogItem(`${supplierId}`, `${id}`, req.body);
  res
    .status(200)
    .json({ message: "Catalog item updated successfully", data: updatedCatalogItem });
});

catalogRouter.delete("/:id", async (req: Request, res: Response) => {
  const { supplierId, id } = req.params;
  await deleteCatalogItem(`${supplierId}`, `${id}`);
  res.json({ message: `Catalog item with ID ${id} deleted successfully` });
});

export default catalogRouter;
