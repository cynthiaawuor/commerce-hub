import type { Request } from "express";
import { BadRequestError } from "./http-error";

// There is no auth service yet, so the caller identifies itself with headers.
// Replace this with a real token check once authentication exists; every call site
// reads the user through here, so only this file changes.
export type CurrentUser = {
  id: string;
  // Only FINANCE can record a payment to a supplier; reports are open to anyone
  role: string;
};

export const getCurrentUser = (req: Request): CurrentUser => {
  const id = req.header("x-user-id")?.trim();

  if (!id) {
    throw new BadRequestError("Missing x-user-id header");
  }

  return { id, role: req.header("x-user-role")?.trim() || "FINANCE" };
};
