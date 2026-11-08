import { requireUser } from "@/server/auth";
import { withErrors } from "@/server/http";
import { listFirms } from "@/server/lookups";

export const GET = withErrors(async () => {
  await requireUser("admin");
  return Response.json(await listFirms());
});
