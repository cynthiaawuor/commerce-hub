import type { Request, Response } from "express";
import express from "express";
import suppliersRouter from "./suppliers/suppliers.router";
import catalogRouter from "./catalog/catalog.router";
import productsRouter from "./products/products.router";
import { mountDocs } from "./core/docs";
import { errorHandler, notFoundHandler } from "./core/error-handler";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Lets Docker and other services check the service is up, without touching the database
app.get("/vendor-api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "vendor" });
});

// The contract other teams build against, served from contracts/openapi/vendor.yaml
mountDocs(app);

app.use("/vendor-api/suppliers/:supplierId/catalog-items", catalogRouter);
app.use("/vendor-api/suppliers", suppliersRouter);
app.use("/vendor-api/products", productsRouter);

// Must be registered after every route
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
