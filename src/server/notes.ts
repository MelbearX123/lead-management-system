import "server-only";
import { sql } from "./db";
import { getLeadForUser } from "./leads";
import { paginate } from "./pagination";
import type { User } from "./users";

export type Note = {
  noteId: number;
  body: string;
  createdAt: Date;
  firmName: string;
  authorName: string;
};

function notesVisibleTo(user: User) {
  switch (user.role) {
    case "admin":
      return sql`TRUE`;
    case "attorney":
    case "paralegal":
      return sql`notes.firm_id = ${user.firmId}`;
    case "plaintiff":
      return sql`FALSE`;
  }
}

export async function listNotes(user: User, leadId: number, page: number) {
  await getLeadForUser(user, leadId);
  return paginate<Note>({
    select: sql`
      SELECT notes.note_id, notes.body, notes.created_at,
             firms.name AS firm_name, users.fname || ' ' || users.lname AS author_name
    `,
    from: sql`
      FROM notes
      JOIN firms ON firms.firm_id = notes.firm_id
      JOIN users ON users.user_id = notes.author_id
      WHERE notes.lead_id = ${leadId} AND ${notesVisibleTo(user)}
    `,
    orderBy: sql`notes.created_at DESC, notes.note_id DESC`,
    page,
  });
}

export async function addNote(staff: User, leadId: number, body: string) {
  await getLeadForUser(staff, leadId);
  const [note] = await sql<{ noteId: number }[]>`
    INSERT INTO notes ${sql({ leadId, firmId: staff.firmId, authorId: staff.userId, body })}
    RETURNING note_id
  `;
  return note;
}
