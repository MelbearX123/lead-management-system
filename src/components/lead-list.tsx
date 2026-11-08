import { listLeads } from "@/server/leads";
import { requirePageUser } from "@/server/pages";
import { pageFrom } from "@/server/pagination";
import type { Role } from "@/server/users";
import { LeadTable } from "./lead-table";
import { Pagination } from "./pagination";

type Props = {
  allowedRoles: Role[];
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function LeadList({ allowedRoles, searchParams }: Props) {
  const user = await requirePageUser(...allowedRoles);
  const page = pageFrom((await searchParams).page);
  const result = await listLeads(user, { sort: "newest", page });

  return (
    <>
      <LeadTable leads={result.items} viewer={user.role} />
      <Pagination result={result} query={{}} />
    </>
  );
}
