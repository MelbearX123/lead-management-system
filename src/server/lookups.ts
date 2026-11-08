import "server-only";
import { connection } from "next/server";
import { sql } from "./db";

export async function listRegions() {
  await connection();
  return sql<{ regionId: string; name: string }[]>`SELECT region_id, name FROM regions ORDER BY name`;
}

export async function listCategories() {
  await connection();
  return sql<{ categoryId: string; name: string }[]>`SELECT category_id, name FROM categories ORDER BY name`;
}

export async function listFirms() {
  await connection();
  return sql<{ firmId: number; name: string }[]>`SELECT firm_id, name FROM firms ORDER BY name`;
}
