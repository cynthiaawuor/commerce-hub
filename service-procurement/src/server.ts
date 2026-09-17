import "dotenv/config";
import type { Request, Response } from "express";
import express from "express";
import { errorHandler, notFoundHandler } from "./core/error-handler";

const app = express();
const PORT = process.env["PORT"] || 3001;

app.use(express.json());

// Lets compose, CI and other services check the service is up, without touching the database
app.get("/procurement-api/procurement", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "procurement" });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Procurement service is running at http://localhost:${PORT}`);
});
