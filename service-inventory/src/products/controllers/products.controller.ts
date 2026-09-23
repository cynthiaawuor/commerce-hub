import type { Request, Response } from "express";
import * as productService from "../products.service";

// Controllers only translate HTTP to service calls: read params and body, pick the
// status code. Express 5 passes thrown errors to the error middleware.

type IdParams = { id: string };
type SkuParams = { sku: string };

const listProducts = async (req: Request, res: Response) => {
  const { data, meta } = await productService.listProducts(req.query);

  res.status(200).json({ data, meta });
};

const getProduct = async (req: Request<IdParams>, res: Response) => {
  res.status(200).json({ data: await productService.getProduct(req.params.id) });
};

// Other services hold SKUs rather than our ids, so they can look a product up by SKU
const getProductBySku = async (req: Request<SkuParams>, res: Response) => {
  res
    .status(200)
    .json({ data: await productService.getProductBySku(req.params.sku) });
};

const createProduct = async (req: Request, res: Response) => {
  const product = await productService.createProduct(req.body);

  res
    .status(201)
    .json({ message: "Product created successfully", data: product });
};

const updateProduct = async (req: Request<IdParams>, res: Response) => {
  const product = await productService.updateProduct(req.params.id, req.body);

  res
    .status(200)
    .json({ message: "Product updated successfully", data: product });
};

export { createProduct, getProduct, getProductBySku, listProducts, updateProduct };
