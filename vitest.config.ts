import { tmpdir } from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/leads_test";
process.env.UPLOADS_DIR = path.join(tmpdir(), "lead-management-test-uploads");

export default defineConfig({
  ssr: { resolve: { conditions: ["react-server"] } },
  test: { globalSetup: "./test/global-setup.ts" },
});
