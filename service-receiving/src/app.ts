import type { Request, Response } from "express";
import express from "express";
import { config } from "./core/config";
import { errorHandler, notFoundHandler } from "./core/error-handler";
import expectedDeliveriesRouter from "./expected-deliveries/expected-deliveries.router";
import goodsReceivedNotesRouter from "./goods-received-notes/goods-received-notes.router";

// Built separately from the server so tests can drive the app without opening a port.
const createApp = () => {
  const app = express();

  app.use(express.json());

  // Let compose, CI and other services check the service is up, without touching the database
  app.get("/receiving-api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "receiving",
      enabled: config.featureReceiving,
    });
  });

  // The whole module sits behind its phase flag: with the flag off the service still
  // runs and answers health checks, but exposes none of its routes.
  if (config.featureReceiving) {
    //TODO
    app.use("/receiving-api/expected-deliveries", expectedDeliveriesRouter);
    app.use("/receiving-api/goods-received-notes", goodsReceivedNotesRouter);
  }

  // Must be registered after every route
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export { createApp };
