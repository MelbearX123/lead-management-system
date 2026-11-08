import "server-only";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const globalForDb = globalThis as typeof globalThis & { sql?: postgres.Sql };

export const sql = (globalForDb.sql ??= postgres(databaseUrl, {
  transform: postgres.camel,
}));
