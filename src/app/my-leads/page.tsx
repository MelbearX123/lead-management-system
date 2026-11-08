import { Suspense } from "react";
import { LeadList } from "@/components/lead-list";

export default function MyLeadsPage({ searchParams }: PageProps<"/my-leads">) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">My leads</h1>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <LeadList allowedRoles={["plaintiff"]} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
