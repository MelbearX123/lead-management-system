import { Suspense } from "react";
import { DEMO_PASSWORD } from "@/server/auth";
import { listCategories, listRegions } from "@/server/lookups";
import { LeadForm } from "./lead-form";

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-2xl font-semibold">Get legal help</h1>
      <p className="mb-6 text-gray-600">Tell us what happened and we&apos;ll connect you with a law firm.</p>
      <Suspense fallback={<p className="text-gray-500">Loading…</p>}>
        <LeadFormWithOptions />
      </Suspense>
    </div>
  );
}

async function LeadFormWithOptions() {
  const [regions, categories] = await Promise.all([listRegions(), listCategories()]);
  return (
    <LeadForm
      regions={regions.map((region) => ({ id: region.regionId, name: region.name }))}
      categories={categories.map((category) => ({ id: category.categoryId, name: category.name }))}
      demoPassword={DEMO_PASSWORD}
    />
  );
}
