import { Suspense } from "react";
import { LeadList } from "@/components/lead-list";
import { staffRoles } from "@/server/users";

export default function InboxPage({ searchParams }: PageProps<"/inbox">) {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Inbox</h1>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <LeadList allowedRoles={[...staffRoles]} searchParams={searchParams} filterable />
      </Suspense>
    </>
  );
}
