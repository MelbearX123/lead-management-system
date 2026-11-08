import { sql } from "../src/server/db.ts";

await sql.begin(async (tx) => {
  await tx`SET LOCAL client_min_messages = warning`;
  await tx`DROP SCHEMA public CASCADE`;
  await tx`CREATE SCHEMA public`;
  await tx.file(new URL("schema.sql", import.meta.url).pathname);
});
await sql.end();

console.log("Database reset");
