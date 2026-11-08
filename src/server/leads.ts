import "server-only";
import { sql } from "./db";
import { HttpError } from "./http";
import type { User } from "./users";

export type LeadStatus = "pending" | "accepted";

export type Progress = "intake" | "investigation" | "negotiation" | "litigation" | "closed";

export type Lead = {
  leadId: number;
  plaintiffId: number;
  firmId: number | null;
  regionId: string;
  categoryId: string;
  title: string;
  description: string;
  status: LeadStatus;
  progress: Progress | null;
  isCase: boolean;
  timeSubmit: Date;
};

export function leadsVisibleTo(user: User) {
  switch (user.role) {
    case "admin":
      return sql`TRUE`;
    case "plaintiff":
      return sql`leads.plaintiff_id = ${user.userId}`;
    case "attorney":
    case "paralegal":
      return sql`leads.firm_id = ${user.firmId}`;
  }
}

export async function getLeadForUser(user: User, leadId: number) {
  const [lead] = await sql<Lead[]>`
    SELECT * FROM leads WHERE leads.lead_id = ${leadId} AND ${leadsVisibleTo(user)}
  `;
  if (!lead) throw new HttpError(404, "Lead not found");
  return lead;
}
