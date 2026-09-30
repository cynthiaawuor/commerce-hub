import type { Request, Response } from "express";
import express from "express";
import { config } from "./core/config";
import { mountDocs } from "./core/docs";
import { errorHandler, notFoundHandler } from "./core/error-handler";
import locationsRouter from "./locations/locations.router";
import productsRouter from "./products/products.router";
import reservationsRouter from "./reservations/reservations.router";
import stockRouter from "./stock/stock.router";
import valuationRouter from "./valuation/valuation.router";

// Built separately from the server so tests can drive the app without opening a port.
const createApp = () => {
  const app = express();

  app.use(express.json());

  // Lets compose, CI and other services check the service is up, without touching the database
  app.get("/inventory-api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "inventory",
      enabled: config.featureInventory,
    });
  });

  // Always available, flag or not: the contract is what other teams build against
  mountDocs(app);

  // The whole module sits behind its phase flag: with the flag off the service still
  // runs and answers health checks, but exposes none of its routes.
  if (config.featureInventory) {
    app.use("/inventory-api/products", productsRouter);
    app.use("/inventory-api/locations", locationsRouter);
    app.use("/inventory-api/stock", stockRouter);
    app.use("/inventory-api/reservations", reservationsRouter);
    app.use("/inventory-api/valuation", valuationRouter);
  }

  // Must be registered after every route
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export { createApp };
