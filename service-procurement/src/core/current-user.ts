import type { Request } from "express";
import { BadRequestError } from "./http-error";

//TODO
// There is no auth service yet, so the caller identifies itself with headers.
// Replace this with a real token check once authentication exists; every call site
// reads the user through here, so only this file changes.
export type CurrentUser = {
  id: string;
  // Used from stage 5, where approvals above KES 100,000 need a manager
  role: string;
};

export const getCurrentUser = (req: Request): CurrentUser => {
  const id = req.header("x-user-id")?.trim();

  if (!id) {
    throw new BadRequestError("Missing x-user-id header");
  }

  return { id, role: req.header("x-user-role")?.trim() || "BUYER" };
};
