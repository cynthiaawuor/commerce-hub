import "dotenv/config";
import "temporal-polyfill/full/global";

import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

export const db = postgres<Contract>({
  contractJson,
  url: process.env["DATABASE_URL"]!,
});

// The driver normalizes unique/primary-key violations onto SQLSTATE 23505.
export const isUniqueViolation = (err: unknown) =>
  (err as { sqlState?: string } | null)?.sqlState === "23505";
