import { fileURLToPath } from "node:url";
import { sql } from "../src/server/db.ts";
import { deleteAllFiles } from "../src/server/storage.ts";
import { seed } from "./seed.ts";

await sql.begin(async (tx) => {
  await tx`SET LOCAL client_min_messages = warning`;
  await tx`DROP SCHEMA public CASCADE`;
  await tx`CREATE SCHEMA public`;
  await tx.file(fileURLToPath(new URL("schema.sql", import.meta.url)));
});
await deleteAllFiles();
await seed();
await sql.end();

console.log("Database reset and seeded");
