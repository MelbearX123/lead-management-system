import "server-only";
import type postgres from "postgres";
import { sql } from "./db";
import { HttpError } from "./http";
import { findOrCreatePlaintiff, type User } from "./users";

export const leadStatuses = ["pending", "accepted"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const progressStages = ["intake", "investigation", "negotiation", "litigation", "closed"] as const;
export type Progress = (typeof progressStages)[number];

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

export type NewLead = {
  fname: string;
  lname: string;
  email: string;
  regionId: string;
  categoryId: string;
  title: string;
  description: string;
};

const historyFields = { firmId: "firm", status: "status", progress: "progress" } as const;

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

export function submitLead({ fname, lname, email, regionId, categoryId, title, description }: NewLead) {
  return sql.begin(async (tx) => {
    const plaintiffId = await findOrCreatePlaintiff(tx, { fname, lname, email });
    const [rule] = await tx<{ firmId: number }[]>`
      SELECT firm_id FROM routing_rules WHERE region_id = ${regionId} AND category_id = ${categoryId}
    `;
    const [lead] = await tx<Lead[]>`
      INSERT INTO leads ${tx({ plaintiffId, firmId: rule?.firmId ?? null, regionId, categoryId, title, description })}
      RETURNING *
    `;
    await recordHistory(tx, null, { ...lead, firmId: null }, lead);
    return lead;
  });
}

async function recordHistory(tx: postgres.TransactionSql, actorId: number | null, before: Lead, after: Lead) {
  const changed = (Object.keys(historyFields) as (keyof typeof historyFields)[]).filter(
    (key) => before[key] !== after[key],
  );
  if (changed.length === 0) return;

  await tx`
    INSERT INTO history ${tx(
      changed.map((key) => ({
        leadId: after.leadId,
        actorId,
        field: historyFields[key],
        oldValue: toText(before[key]),
        newValue: toText(after[key]),
      })),
    )}
  `;
}

function toText(value: string | number | null) {
  return value === null ? null : String(value);
}
