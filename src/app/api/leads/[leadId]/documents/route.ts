import { z } from "zod";
import { requireUser } from "@/server/auth";
import { addDocument, listDocuments, MAX_PDF_BYTES } from "@/server/documents";
import { parseFile, parseId, parseQuery, withErrors } from "@/server/http";
import { pageSchema } from "@/server/pagination";
import { staffRoles } from "@/server/users";

type Context = RouteContext<"/api/leads/[leadId]/documents">;

export const GET = withErrors(async (request: Request, { params }: Context) => {
  const user = await requireUser();
  const { page } = parseQuery(request, z.object({ page: pageSchema }));
  return Response.json(await listDocuments(user, parseId((await params).leadId), page));
});

export const POST = withErrors(async (request: Request, { params }: Context) => {
  const user = await requireUser("plaintiff", ...staffRoles);
  const file = await parseFile(request, "file", MAX_PDF_BYTES);
  const document = await addDocument(user, parseId((await params).leadId), file);
  return Response.json(document, { status: 201 });
});
