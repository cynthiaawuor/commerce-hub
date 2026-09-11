import type { NextFunction, Request, Response } from "express";
import { isUniqueViolation } from "../prisma/db";
import { HttpError } from "./http-error";

function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found` } });
}

// Express 5 forwards errors thrown in async handlers here automatically.
function errorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  // A response is already streaming; let Express close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // Thrown by express.json() when the body is not valid JSON
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Malformed JSON body" } });
    return;
  }

  // Other express.json() failures (payload too large, unsupported charset, ...) carry a safe 4xx status
  if (err?.expose && typeof err.status === "number" && err.status < 500) {
    res.status(err.status).json({ error: { message: err.message } });
    return;
  }

  // Fallback for unique constraints a service didn't translate into a ConflictError
  if (isUniqueViolation(err)) {
    res.status(409).json({ error: { message: "A record with the same unique value already exists" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}

export { notFoundHandler, errorHandler };
