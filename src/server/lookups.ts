import "server-only";
import { sql } from "./db";

export function listRegions() {
  return sql<{ regionId: string; name: string }[]>`SELECT region_id, name FROM regions ORDER BY name`;
}

export function listCategories() {
  return sql<{ categoryId: string; name: string }[]>`SELECT category_id, name FROM categories ORDER BY name`;
}

export function listFirms() {
  return sql<{ firmId: number; name: string }[]>`SELECT firm_id, name FROM firms ORDER BY name`;
}
