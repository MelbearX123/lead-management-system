import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { LeadDetails } from "@/server/leads";
import type { Role } from "@/server/users";
import { LeadStatus } from "./lead-status";

export function LeadTable({ leads, viewer }: { leads: LeadDetails[]; viewer: Role }) {
  if (leads.length === 0) return <p className="py-6 text-gray-500">No leads found.</p>;

  const showPlaintiff = viewer !== "plaintiff";
  const showFirm = viewer === "plaintiff" || viewer === "admin";

  return (
    <table className="w-full border-collapse bg-white text-sm">
      <thead className="border-b text-left text-gray-500">
        <tr>
          <th className="p-3 font-medium">Title</th>
          <th className="p-3 font-medium">Category</th>
          <th className="p-3 font-medium">Region</th>
          {showPlaintiff && <th className="p-3 font-medium">Plaintiff</th>}
          {showFirm && <th className="p-3 font-medium">Firm</th>}
          <th className="p-3 font-medium">Submitted</th>
          <th className="p-3 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => (
          <tr key={lead.leadId} className="border-b last:border-0">
            <td className="p-3">
              <Link href={`/leads/${lead.leadId}`} className="font-medium hover:underline">
                {lead.title}
              </Link>
            </td>
            <td className="p-3">{lead.categoryName}</td>
            <td className="p-3">{lead.regionName}</td>
            {showPlaintiff && <td className="p-3">{lead.plaintiffName}</td>}
            {showFirm && <td className="p-3">{lead.firmName ?? "—"}</td>}
            <td className="p-3">{formatDate(lead.timeSubmit)}</td>
            <td className="p-3">
              <LeadStatus lead={lead} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
