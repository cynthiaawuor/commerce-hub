import { defineConfig } from "vitest/config";

// Integration tests share one database, so they run against their own database and
// one file at a time. Unit tests are pure and run in parallel.
const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ??
  "postgresql://postgres:postgres@localhost:5435/service-procurement-test";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/integration/global-setup.ts"],
          fileParallelism: false,
          env: {
            DATABASE_URL: TEST_DATABASE_URL,
            // Keep the tests away from the broker: they call handlers directly
            FEATURE_PROCUREMENT: "true",
          },
        },
      },
    ],
  },
});
