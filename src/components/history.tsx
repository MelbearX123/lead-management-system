import { capitalize, formatDateTime } from "@/lib/format";
import { type HistoryEntry, listHistory } from "@/server/history";
import type { User } from "@/server/users";
import { Pagination } from "./pagination";

type Firm = { firmId: number; name: string };

type Props = { admin: User; leadId: number; page: number; query: Record<string, string>; firms: Firm[] };

const fieldLabels = { firm: "Firm", status: "Status", progress: "Progress" };

export async function History({ admin, leadId, page, query, firms }: Props) {
  const result = await listHistory(admin, leadId, page);
  const firmNames = new Map(firms.map((firm) => [String(firm.firmId), firm.name]));

  function show(field: HistoryEntry["field"], value: string | null) {
    if (value === null) return field === "firm" ? "No firm" : "None";
    return field === "firm" ? (firmNames.get(value) ?? `Firm ${value}`) : capitalize(value);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">History</h2>
      {result.items.length === 0 ? (
        <p className="text-sm text-gray-500">No changes yet.</p>
      ) : (
        <table className="w-full border-collapse bg-white text-sm">
          <thead className="border-b text-left text-gray-500">
            <tr>
              <th className="p-3 font-medium">When</th>
              <th className="p-3 font-medium">Who</th>
              <th className="p-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((entry) => (
              <tr key={entry.historyId} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
                <td className="p-3">{entry.actorName ?? "System (routing)"}</td>
                <td className="p-3">
                  {fieldLabels[entry.field]}: {show(entry.field, entry.oldValue)} → {show(entry.field, entry.newValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {result.total > result.pageSize && <Pagination result={result} query={query} param="historyPage" />}
    </section>
  );
}
