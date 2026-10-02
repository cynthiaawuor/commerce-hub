import type { Request, Response } from "express";
import express from "express";
import { config } from "./core/config";
import { mountDocs } from "./core/docs";
import { errorHandler, notFoundHandler } from "./core/error-handler";
import ledgerRouter from "./ledger/ledger.router";
import { commitmentsRouter, payablesRouter } from "./payables/payables.router";
import reportsRouter from "./reports/reports.router";

// Built separately from the server so tests can drive the app without opening a port.
const createApp = () => {
  const app = express();

  app.use(express.json());

  // Let compose, CI and other services check the service is up, without touching the database
  app.get("/financials-api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "financials",
      enabled: config.featureFinancials,
    });
  });

  // Always available, flag or not: the contract is what other teams build against
  mountDocs(app);

  // The whole module sits behind its phase flag: with the flag off the service still
  // runs and answers health checks, but exposes none of its routes.
  if (config.featureFinancials) {
    app.use("/financials-api/ledger", ledgerRouter);
    app.use("/financials-api/bills", payablesRouter);
    app.use("/financials-api/commitments", commitmentsRouter);
    app.use("/financials-api/reports", reportsRouter);
  }

  // Must be registered after every route
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export { createApp };
