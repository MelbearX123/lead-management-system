import { z } from "zod";
import { requireUser } from "@/server/auth";
import { parseBody, parseId, withErrors } from "@/server/http";
import { progressStages } from "@/lib/lead-states";
import { updateProgress } from "@/server/leads";
import { staffRoles } from "@/server/users";

const progressSchema = z.object({ progress: z.enum(progressStages) });

export const PATCH = withErrors(
  async (request: Request, { params }: RouteContext<"/api/leads/[leadId]/progress">) => {
    const staff = await requireUser(...staffRoles);
    const { progress } = await parseBody(request, progressSchema);
    return Response.json(await updateProgress(staff, parseId((await params).leadId), progress));
  },
);
