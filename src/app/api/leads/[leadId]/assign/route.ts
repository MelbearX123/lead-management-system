import { z } from "zod";
import { requireUser } from "@/server/auth";
import { parseBody, parseId, withErrors } from "@/server/http";
import { assignLead } from "@/server/leads";

const assignSchema = z.object({ firmId: z.number().int().positive() });

export const POST = withErrors(
  async (request: Request, { params }: RouteContext<"/api/leads/[leadId]/assign">) => {
    const admin = await requireUser("admin");
    const { firmId } = await parseBody(request, assignSchema);
    return Response.json(await assignLead(admin, parseId((await params).leadId), firmId));
  },
);
