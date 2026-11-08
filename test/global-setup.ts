import { execFileSync } from "node:child_process";
import postgres from "postgres";

export default async function createAndResetTestDatabase() {
  const testDatabaseUrl = process.env.DATABASE_URL!;
  const testDatabase = new URL(testDatabaseUrl).pathname.slice(1);

  const server = postgres(testDatabaseUrl, { database: "postgres" });
  const [exists] = await server`SELECT 1 FROM pg_database WHERE datname = ${testDatabase}`;
  if (!exists) await server`CREATE DATABASE ${server(testDatabase)}`;
  await server.end();

  execFileSync("npm", ["run", "--silent", "db:reset"], { stdio: "inherit" });
}
