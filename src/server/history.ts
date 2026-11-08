import "server-only";
import { sql } from "./db";
import { getLeadForUser } from "./leads";
import { paginate } from "./pagination";
import type { User } from "./users";

export type HistoryEntry = {
  historyId: number;
  field: "firm" | "status" | "progress";
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  actorName: string | null;
};

export async function listHistory(admin: User, leadId: number, page: number) {
  await getLeadForUser(admin, leadId);
  return paginate<HistoryEntry>({
    select: sql`
      SELECT history.history_id, history.field, history.old_value, history.new_value, history.created_at,
             users.fname || ' ' || users.lname AS actor_name
    `,
    from: sql`
      FROM history LEFT JOIN users ON users.user_id = history.actor_id
      WHERE history.lead_id = ${leadId}
    `,
    orderBy: sql`history.created_at, history.history_id`,
    page,
  });
}
