import "server-only";
import { notFound, redirect } from "next/navigation";
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
