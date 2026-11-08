import "server-only";
import { notFound, redirect } from "next/navigation";
import type { z } from "zod";
import { getCurrentUser } from "./auth";
import { HttpError } from "./http";
import type { Role } from "./users";

export function homePath(role: Role) {
  switch (role) {
    case "plaintiff":
      return "/my-leads";
    case "attorney":
    case "paralegal":
      return "/inbox";
    case "admin":
      return "/admin";
  }
}

export async function requirePageUser(...allowedRoles: Role[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) redirect(homePath(user.role));
  return user;
}

export async function loadOrNotFound<T>(load: () => Promise<T>) {
  try {
    return await load();
  } catch (error) {
    if (error instanceof HttpError && (error.status === 400 || error.status === 404)) notFound();
    throw error;
  }
}

export type SearchParams = Record<string, string | string[] | undefined>;

export function filledSearchParams(params: SearchParams) {
  return Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""),
  );
}

export function parseSearchParams<T>(schema: z.ZodType<T>, params: Record<string, string>) {
  const result = schema.safeParse(params);
  return result.success ? result.data : schema.parse({});
}
