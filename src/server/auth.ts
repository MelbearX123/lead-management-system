import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { HttpError } from "./http";
import { findUserByEmail, findUserById, type Role } from "./users";

const DEMO_PASSWORD = "demo";

async function getSession() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");

  return getIronSession<{ userId?: number }>(await cookies(), {
    password: secret,
    cookieName: "session",
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
  });
}

export async function signIn(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || password !== DEMO_PASSWORD) throw new HttpError(401, "Wrong email or password");

  const session = await getSession();
  session.userId = user.userId;
  await session.save();
  return user;
}

export async function signOut() {
  const session = await getSession();
  session.destroy();
}

export async function requireUser(...allowedRoles: Role[]) {
  const { userId } = await getSession();
  const user = userId ? await findUserById(userId) : null;
  if (!user) throw new HttpError(401, "Sign in required");
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new HttpError(403, "Not allowed");
  }
  return user;
}
