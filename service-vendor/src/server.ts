import type { Request, Response } from "express";
import express from "express";
import suppliersRouter from "./suppliers/suppliers.router";
import catalogRouter from "./catalog/catalog.router";
import productsRouter from "./products/products.router";
import { errorHandler, notFoundHandler } from "./core/error-handler";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/vendor-api/suppliers/:supplierId/catalog-items", catalogRouter);
app.use("/vendor-api/suppliers", suppliersRouter);
app.use("/vendor-api/products", productsRouter);

// Must be registered after every route
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
