import { leadFiltersSchema, listLeads } from "@/server/leads";
import { filledSearchParams, parseSearchParams, requirePageUser, type SearchParams } from "@/server/pages";
import type { Role } from "@/server/users";
import { LeadFilters } from "./lead-filters";
import { LeadTable } from "./lead-table";
import { Pagination } from "./pagination";

type Props = {
  allowedRoles: Role[];
  searchParams: Promise<SearchParams>;
  filterable?: boolean;
};

export async function LeadList({ allowedRoles, searchParams, filterable = false }: Props) {
  const user = await requirePageUser(...allowedRoles);
  const query = filledSearchParams(await searchParams);
  const filters = parseSearchParams(leadFiltersSchema, query);
  const result = await listLeads(user, filters);

  return (
    <>
      {filterable && <LeadFilters filters={filters} admin={user.role === "admin"} />}
      <LeadTable leads={result.items} viewer={user.role} />
      <Pagination result={result} query={query} />
    </>
  );
}
