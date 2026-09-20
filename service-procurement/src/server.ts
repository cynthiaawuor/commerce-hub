import "dotenv/config";
import type { Request, Response } from "express";
import express from "express";
import { errorHandler, notFoundHandler } from "./core/error-handler";
import { startOutboxWorker, stopOutboxWorker } from "./events/outbox-worker";
import purchaseOrdersRouter from "./purchase-orders/purchase-orders.router";

const app = express();
const PORT = process.env["PORT"] || 3001;

app.use(express.json());

// Lets compose, CI and other services check the service is up, without touching the database
app.get("/procurement-api/procurement", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "procurement" });
});

app.use("/procurement-api/purchase-orders", purchaseOrdersRouter);

// Must be registered after every route
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Procurement service is running at http://localhost:${PORT}`);
  startOutboxWorker();
});

// Close the broker connection cleanly so in-flight publishes are not cut off
const shutdown = async () => {
  await stopOutboxWorker();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
