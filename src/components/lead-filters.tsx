import Link from "next/link";
import type { LeadFilters as Filters } from "@/server/leads";
import { listCategories, listFirms, listRegions } from "@/server/lookups";

const fieldClass = "rounded border bg-white px-2 py-1.5";

type Props = { filters: Filters; admin: boolean };

export async function LeadFilters({ filters, admin }: Props) {
  const [regions, categories, firms] = await Promise.all([
    listRegions(),
    listCategories(),
    admin ? listFirms() : [],
  ]);

  return (
    <form className="mb-4 flex flex-wrap items-center gap-3 text-sm">
      {admin && (
        <input
          name="q"
          type="search"
          aria-label="Search"
          placeholder="Search title or plaintiff"
          defaultValue={filters.q ?? ""}
          className={`${fieldClass} w-60`}
        />
      )}
      <select name="status" aria-label="Status" defaultValue={filters.status ?? ""} className={fieldClass}>
        <option value="">Any status</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
      </select>
      <select name="categoryId" aria-label="Type of case" defaultValue={filters.categoryId ?? ""} className={fieldClass}>
        <option value="">Any type</option>
        {categories.map((category) => (
          <option key={category.categoryId} value={category.categoryId}>
            {category.name}
          </option>
        ))}
      </select>
      <select name="regionId" aria-label="State" defaultValue={filters.regionId ?? ""} className={fieldClass}>
        <option value="">Any state</option>
        {regions.map((region) => (
          <option key={region.regionId} value={region.regionId}>
            {region.name}
          </option>
        ))}
      </select>
      {admin && (
        <>
          <select name="firmId" aria-label="Firm" defaultValue={String(filters.firmId ?? "")} className={fieldClass}>
            <option value="">Any firm</option>
            <option value="unmatched">Unmatched</option>
            {firms.map((firm) => (
              <option key={firm.firmId} value={firm.firmId}>
                {firm.name}
              </option>
            ))}
          </select>
          <select name="sort" aria-label="Sort" defaultValue={filters.sort} className={fieldClass}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </>
      )}
      <button className="rounded bg-gray-900 px-3 py-1.5 text-white">Filter</button>
      <Link href="?" className="text-gray-600 hover:text-gray-900">
        Clear
      </Link>
    </form>
  );
}
