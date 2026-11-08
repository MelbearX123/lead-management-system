import { requireUser } from "@/server/auth";
import { readDocument } from "@/server/documents";
import { parseId, withErrors } from "@/server/http";

export const GET = withErrors(
  async (_request: Request, { params }: RouteContext<"/api/leads/[leadId]/documents/[documentId]">) => {
    const user = await requireUser();
    const { leadId, documentId } = await params;
    const { fileName, data } = await readDocument(user, parseId(leadId), parseId(documentId));
    return new Response(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
