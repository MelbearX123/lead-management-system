import "server-only";
import type postgres from "postgres";
import { sql } from "./db";

export type Role = "plaintiff" | "attorney" | "paralegal" | "admin";

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
