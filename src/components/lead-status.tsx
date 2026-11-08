import { capitalize } from "@/lib/format";
import type { Lead } from "@/server/leads";

export function LeadStatus({ lead }: { lead: Pick<Lead, "status" | "firmId" | "progress"> }) {
  const [label, colors] =
    lead.status === "accepted"
      ? [capitalize(lead.progress ?? "accepted"), "bg-green-100 text-green-800"]
      : lead.firmId === null
        ? ["Unassigned", "bg-amber-100 text-amber-800"]
        : ["Awaiting firm", "bg-blue-100 text-blue-800"];

  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${colors}`}>{label}</span>;
}
