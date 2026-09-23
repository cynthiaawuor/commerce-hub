import type { Request, Response } from "express";
import express from "express";
import { config } from "./core/config";
import { errorHandler, notFoundHandler } from "./core/error-handler";

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

  // The whole module sits behind its phase flag: with the flag off the service still
  // runs and answers health checks, but exposes none of its routes.
  if (config.featureInventory) {
    //TODO
  }

  // Must be registered after every route
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export { createApp };
