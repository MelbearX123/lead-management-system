import { z } from "zod";
import { requireUser } from "@/server/auth";
import { parseBody, parseId, parseQuery, withErrors } from "@/server/http";
import { addNote, listNotes } from "@/server/notes";
import { pageSchema } from "@/server/pagination";
import { staffRoles } from "@/server/users";

type Context = RouteContext<"/api/leads/[leadId]/notes">;

const noteSchema = z.object({ body: z.string().trim().min(1).max(5000) });

export const GET = withErrors(async (request: Request, { params }: Context) => {
  const user = await requireUser(...staffRoles, "admin");
  const { page } = parseQuery(request, z.object({ page: pageSchema }));
  return Response.json(await listNotes(user, parseId((await params).leadId), page));
});

export const POST = withErrors(async (request: Request, { params }: Context) => {
  const staff = await requireUser(...staffRoles);
  const { body } = await parseBody(request, noteSchema);
  return Response.json(await addNote(staff, parseId((await params).leadId), body), { status: 201 });
});
