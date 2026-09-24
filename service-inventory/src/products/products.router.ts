import { Router } from "express";
import * as productController from "./controllers/products.controller";

const productsRouter: Router = Router();

productsRouter.get("/", productController.listProducts);
productsRouter.post("/", productController.createProduct);

// Must come before "/:id", or Express would read "sku" as a product id
productsRouter.get("/sku/:sku", productController.getProductBySku);

productsRouter.get("/:id", productController.getProduct);
productsRouter.patch("/:id", productController.updateProduct);

export default productsRouter;
