import { z } from "zod";
import { requireUser } from "@/server/auth";
import { listHistory } from "@/server/history";
import { parseId, parseQuery, withErrors } from "@/server/http";
import { pageSchema } from "@/server/pagination";

export const GET = withErrors(
  async (request: Request, { params }: RouteContext<"/api/leads/[leadId]/history">) => {
    const admin = await requireUser("admin");
    const { page } = parseQuery(request, z.object({ page: pageSchema }));
    return Response.json(await listHistory(admin, parseId((await params).leadId), page));
  },
);
