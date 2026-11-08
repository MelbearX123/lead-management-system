import { defineConfig } from "vitest/config";

process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/leads_test";

export default defineConfig({
  ssr: { resolve: { conditions: ["react-server"] } },
  test: { globalSetup: "./test/global-setup.ts" },
});
