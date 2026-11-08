import { formatBytes, formatDate } from "@/lib/format";
import { listDocuments } from "@/server/documents";
import type { User } from "@/server/users";
import { Pagination } from "./pagination";
import { UploadDocument } from "./upload-document";

export async function Documents({ user, leadId, page }: { user: User; leadId: number; page: number }) {
  const result = await listDocuments(user, leadId, page);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Documents</h2>
      {result.items.length === 0 ? (
        <p className="text-sm text-gray-500">No documents yet.</p>
      ) : (
        <ul className="divide-y rounded border bg-white text-sm">
          {result.items.map((document) => (
            <li key={document.documentId} className="flex justify-between px-3 py-2">
              <a
                href={`/api/leads/${leadId}/documents/${document.documentId}`}
                target="_blank"
                className="font-medium hover:underline"
              >
                {document.fileName}
              </a>
              <span className="text-gray-500">
                {document.uploaderName} · {formatDate(document.createdAt)} · {formatBytes(document.sizeBytes)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {result.total > result.pageSize && <Pagination result={result} query={{}} param="documentsPage" />}
      {user.role !== "admin" && <UploadDocument leadId={leadId} />}
    </section>
  );
}
