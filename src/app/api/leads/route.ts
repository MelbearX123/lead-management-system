import { z } from "zod";
import { requireUser } from "@/server/auth";
import { parseBody, parseQuery, withErrors } from "@/server/http";
import { leadFiltersSchema, listLeads, submitLead } from "@/server/leads";

const name = z.string().trim().min(1).max(100);

const newLeadSchema = z.object({
  fname: name,
  lname: name,
  email: z.email(),
  regionId: z.string(),
  categoryId: z.string(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
});

export const GET = withErrors(async (request: Request) => {
  const user = await requireUser();
  return Response.json(await listLeads(user, parseQuery(request, leadFiltersSchema)));
});

export const POST = withErrors(async (request: Request) => {
  const lead = await submitLead(await parseBody(request, newLeadSchema));
  return Response.json(lead, { status: 201 });
});
