import Link from "next/link";
import { Suspense } from "react";
import { LeadList } from "@/components/lead-list";

export default function MyLeadsPage({ searchParams }: PageProps<"/my-leads">) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My leads</h1>
        <Link href="/submit" className="rounded bg-gray-900 px-3 py-1.5 text-sm text-white">
          Submit a new lead
        </Link>
      </div>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <LeadList allowedRoles={["plaintiff"]} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
