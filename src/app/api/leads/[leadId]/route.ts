import { requireUser } from "@/server/auth";
import { parseId, withErrors } from "@/server/http";
import { getLeadForUser } from "@/server/leads";

export const GET = withErrors(async (_request: Request, { params }: RouteContext<"/api/leads/[leadId]">) => {
  const user = await requireUser();
  return Response.json(await getLeadForUser(user, parseId((await params).leadId)));
});
