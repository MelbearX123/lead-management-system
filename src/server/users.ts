import "server-only";
import type postgres from "postgres";
import { sql } from "./db";
import { HttpError } from "./http";

export type Role = "plaintiff" | "attorney" | "paralegal" | "admin";

export const staffRoles = ["attorney", "paralegal"] as const;

export function isStaff(user: User) {
  return user.role === "attorney" || user.role === "paralegal";
}

export type User = {
  userId: number;
  role: Role;
  firmId: number | null;
  firmName: string | null;
  fname: string;
  lname: string;
  email: string;
};

export function findUserById(userId: number) {
  return findUser(sql`users.user_id = ${userId}`);
}

export function findUserByEmail(email: string) {
  return findUser(sql`users.email = ${email.toLowerCase()}`);
}

async function findUser(condition: postgres.Fragment) {
  const [user] = await sql<User[]>`
    SELECT users.user_id, users.role, users.firm_id, firms.name AS firm_name,
           users.fname, users.lname, users.email
    FROM users
    LEFT JOIN firms ON firms.firm_id = users.firm_id
    WHERE ${condition}
  `;
  return user ?? null;
}

export async function findOrCreatePlaintiff(
  tx: postgres.TransactionSql,
  { fname, lname, email }: { fname: string; lname: string; email: string },
) {
  const normalizedEmail = email.toLowerCase();
  await tx`
    INSERT INTO users ${tx({ role: "plaintiff", fname, lname, email: normalizedEmail })}
    ON CONFLICT (email) DO NOTHING
  `;
  const [user] = await tx<{ userId: number; role: Role }[]>`
    SELECT user_id, role FROM users WHERE email = ${normalizedEmail}
  `;
  if (user.role !== "plaintiff") throw new HttpError(400, "Use a different email to submit a lead");
  return user.userId;
}
