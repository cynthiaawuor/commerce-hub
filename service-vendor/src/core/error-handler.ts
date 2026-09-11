import type { NextFunction, Request, Response } from "express";
import { HttpError } from "./http-error";

function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { message: `Route ${req.method} ${req.path} not found` } });
}

// Express 5 forwards errors thrown in async handlers here automatically.
function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, details: err.details } });
    return;
  }

  // Thrown by express.json() when the body is not valid JSON
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: { message: "Malformed JSON body" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Internal server error" } });
}

export { notFoundHandler, errorHandler };
