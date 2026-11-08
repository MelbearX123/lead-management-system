import Link from "next/link";
import type { LeadFilters as Filters } from "@/server/leads";
import { listCategories, listRegions } from "@/server/lookups";

const selectClass = "rounded border bg-white px-2 py-1.5";

export async function LeadFilters({ filters }: { filters: Filters }) {
  const [regions, categories] = await Promise.all([listRegions(), listCategories()]);

  return (
    <form className="mb-4 flex flex-wrap items-center gap-3 text-sm">
      <select name="status" defaultValue={filters.status ?? ""} className={selectClass}>
        <option value="">Any status</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
      </select>
      <select name="categoryId" defaultValue={filters.categoryId ?? ""} className={selectClass}>
        <option value="">Any type</option>
        {categories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.name}
          </option>
        ))}
      </select>
      <select name="regionId" defaultValue={filters.regionId ?? ""} className={selectClass}>
        <option value="">Any state</option>
        {regions.map((region) => (
          <option key={region.regionId} value={region.regionId}>
            {region.name}
          </option>
        ))}
      </select>
      <button className="rounded bg-gray-900 px-3 py-1.5 text-white">Filter</button>
      <Link href="?" className="text-gray-600 hover:text-gray-900">
        Clear
      </Link>
    </form>
  );
}
