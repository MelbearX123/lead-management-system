import { Suspense } from "react";
import { LeadList } from "@/components/lead-list";

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">All leads</h1>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <LeadList allowedRoles={["admin"]} searchParams={searchParams} filterable />
      </Suspense>
    </>
  );
}
