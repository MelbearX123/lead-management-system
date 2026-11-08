import { requireUser } from "@/server/auth";
import { parseId, withErrors } from "@/server/http";
import { declineLead } from "@/server/leads";
import { staffRoles } from "@/server/users";

export const POST = withErrors(
  async (_request: Request, { params }: RouteContext<"/api/leads/[leadId]/decline">) => {
    const staff = await requireUser(...staffRoles);
    return Response.json(await declineLead(staff, parseId((await params).leadId)));
  },
);
