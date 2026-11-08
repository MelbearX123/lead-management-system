import { z } from "zod";
import { requireUser } from "@/server/auth";
import { parseBody, parseQuery, withErrors } from "@/server/http";
import { leadStatuses, listLeads, submitLead } from "@/server/leads";
import { pageSchema } from "@/server/pagination";

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

const filtersSchema = z.object({
  q: z.string().trim().min(1).optional(),
  regionId: z.string().optional(),
  categoryId: z.string().optional(),
  firmId: z.union([z.literal("unmatched"), z.coerce.number().int().positive()]).optional(),
  status: z.enum(leadStatuses).optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: pageSchema,
});

export const GET = withErrors(async (request: Request) => {
  const user = await requireUser();
  return Response.json(await listLeads(user, parseQuery(request, filtersSchema)));
});

export const POST = withErrors(async (request: Request) => {
  const lead = await submitLead(await parseBody(request, newLeadSchema));
  return Response.json(lead, { status: 201 });
});
