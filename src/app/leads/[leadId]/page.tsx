import { Suspense } from "react";
import { AssignLead } from "@/components/assign-lead";
import { CaseProgress } from "@/components/case-progress";
import { Documents } from "@/components/documents";
import { LeadStatus } from "@/components/lead-status";
import { Notes } from "@/components/notes";
import { StaffActions } from "@/components/staff-actions";
import { formatDate } from "@/lib/format";
import { parseId } from "@/server/http";
import { getLeadForUser } from "@/server/leads";
import { listFirms } from "@/server/lookups";
import { filledSearchParams, loadOrNotFound, requirePageUser } from "@/server/pages";
import { pageFrom } from "@/server/pagination";
import { isStaff } from "@/server/users";

export default function LeadPage({ params, searchParams }: PageProps<"/leads/[leadId]">) {
  return (
    <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
      <LeadDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LeadDetail({ params, searchParams }: PageProps<"/leads/[leadId]">) {
  const user = await requirePageUser();
  const { leadId } = await params;
  const lead = await loadOrNotFound(() => getLeadForUser(user, parseId(leadId)));
  const query = filledSearchParams(await searchParams);
  const firms = user.role === "admin" ? await listFirms() : [];

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{lead.title}</h1>
          <LeadStatus lead={lead} />
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm sm:grid-cols-3">
          <Field label="Plaintiff" value={`${lead.plaintiffName} (${lead.plaintiffEmail})`} />
          <Field label="Firm" value={lead.firmName ?? "Unassigned"} />
          <Field label="Submitted" value={formatDate(lead.timeSubmit)} />
          <Field label="Category" value={lead.categoryName} />
          <Field label="Region" value={lead.regionName} />
        </dl>
        <p className="whitespace-pre-wrap rounded border bg-white p-4">{lead.description}</p>
      </header>
      {user.role === "admin" && (
        <AssignLead key={lead.firmId ?? "none"} leadId={lead.leadId} currentFirmId={lead.firmId} firms={firms} />
      )}
      {isStaff(user) && (
        <StaffActions
          key={`${lead.status}-${lead.progress}`}
          leadId={lead.leadId}
          status={lead.status}
          progress={lead.progress}
        />
      )}
      {lead.progress && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Progress</h2>
          <CaseProgress progress={lead.progress} />
        </section>
      )}
      <Documents user={user} leadId={lead.leadId} page={pageFrom(query.documentsPage)} query={query} />
      {user.role !== "plaintiff" && (
        <Notes user={user} leadId={lead.leadId} page={pageFrom(query.notesPage)} query={query} />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
