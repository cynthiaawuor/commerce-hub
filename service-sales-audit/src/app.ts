import type { Request, Response } from "express";
import express from "express";
import { config } from "./core/config";
import { mountDocs } from "./core/docs";
import { errorHandler, notFoundHandler } from "./core/error-handler";
import registerDaysRouter from "./register-days/register-days.router";

// Built separately from the server so tests can drive the app without opening a port.
const createApp = () => {
  const app = express();

  app.use(express.json());

  // Let compose, CI and other services check the service is up, without touching the database
  app.get("/sales-audit-api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "sales-audit",
      enabled: config.featureSalesAudit,
    });
  });

  // Always available, flag or not: the contract is what other teams build against
  mountDocs(app);

  // The whole module sits behind its phase flag: with the flag off the service still
  // runs and answers health checks, but exposes none of its routes.
  if (config.featureSalesAudit) {
    app.use("/sales-audit-api/register-days", registerDaysRouter);
  }

  // Must be registered after every route
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export { createApp };
