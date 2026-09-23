import { execFileSync } from "node:child_process";
import pg from "pg";

// Integration tests wipe tables between tests, so they must never point at a developer's
// database. This creates a dedicated test database and brings it up to the current
// migrations, which is also what CI needs.
const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5435/service-procurement-test";

const ensureDatabaseExists = async () => {
  const target = new URL(TEST_DATABASE_URL);
  const databaseName = decodeURIComponent(target.pathname.slice(1));

  const admin = new URL(TEST_DATABASE_URL);
  admin.pathname = "/postgres";

  const client = new pg.Client({ connectionString: admin.toString() });

  try {
    await client.connect();
  } catch (err) {
    throw new Error(
      `Cannot reach Postgres at ${admin.host}. Start it with "task infra:up".\n${err}`,
    );
  }

  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (!rowCount) {
      await client.query(`CREATE DATABASE "${databaseName.replace(/"/g, '""')}"`);
    }
  } finally {
    await client.end();
  }
};

export default async function setup() {
  await ensureDatabaseExists();

  execFileSync(
    "npx",
    ["prisma", "db", "migrate", "--db", TEST_DATABASE_URL, "--yes", "--no-interactive"],
    { stdio: "inherit" },
  );
}
