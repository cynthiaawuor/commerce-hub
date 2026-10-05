// Postgres SQLSTATE for a unique or primary-key violation; the Prisma driver normalizes errors onto `sqlState`.
// Kept here rather than in prisma/db.ts so error handling doesn't need a database client.
export const isUniqueViolation = (err: unknown) =>
  (err as { sqlState?: string } | null)?.sqlState === "23505";
