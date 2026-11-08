import "server-only";
import type postgres from "postgres";
import { z } from "zod";
import { sql } from "./db";

const PAGE_SIZE = 25;

export const pageSchema = z.coerce.number().int().min(1).default(1);

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export async function paginate<T extends object>({
  select,
  from,
  orderBy,
  page,
}: {
  select: postgres.Fragment;
  from: postgres.Fragment;
  orderBy: postgres.Fragment;
  page: number;
}): Promise<Page<T>> {
  const [items, [{ total }]] = await Promise.all([
    sql<T[]>`${select} ${from} ORDER BY ${orderBy} LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}`,
    sql<{ total: number }[]>`SELECT count(*)::int AS total ${from}`,
  ]);
  return { items, total, page, pageSize: PAGE_SIZE };
}
