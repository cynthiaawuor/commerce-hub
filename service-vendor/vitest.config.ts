import { defineConfig } from "vitest/config";
import { TEST_DATABASE_URL } from "./tests/integration/test-database-url";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // All integration files share one database, so run them one at a time.
          fileParallelism: false,
          env: {
            DATABASE_URL: TEST_DATABASE_URL,
          },
        },
      },
    ],
  },
});
