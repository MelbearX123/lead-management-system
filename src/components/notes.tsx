import { formatDate } from "@/lib/format";
import { listNotes } from "@/server/notes";
import { isStaff, type User } from "@/server/users";
import { AddNote } from "./add-note";
import { Pagination } from "./pagination";

type Props = { user: User; leadId: number; page: number; query: Record<string, string> };

export async function Notes({ user, leadId, page, query }: Props) {
  const result = await listNotes(user, leadId, page);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Private notes</h2>
        <p className="text-sm text-gray-500">
          {isStaff(user) ? "Only your firm can see these." : "Notes from every firm. Plaintiffs never see these."}
        </p>
      </div>
      {isStaff(user) && <AddNote leadId={leadId} />}
      {result.items.length === 0 ? (
        <p className="text-sm text-gray-500">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {result.items.map((note) => (
            <li key={note.noteId} className="rounded border bg-white p-3 text-sm">
              <p className="whitespace-pre-wrap">{note.body}</p>
              <p className="mt-2 text-gray-500">
                {note.authorName} · {note.firmName} · {formatDate(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {result.total > result.pageSize && <Pagination result={result} query={query} param="notesPage" />}
    </section>
  );
}
