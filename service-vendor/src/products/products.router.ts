import { Router } from "express";
import type { Request, Response } from "express";
import { getProductSuppliers } from "../catalog/catalog.service";

// Product-centric view of the catalog. Vendor Management does not own products
// (Inventory does); this only answers which of our suppliers can provide one.
const productsRouter: Router = Router();

productsRouter.get(
  "/:productId/suppliers",
  async (req: Request<{ productId: string }>, res: Response) => {
    res.status(200).json(await getProductSuppliers(req.params.productId));
  },
);

export default productsRouter;
