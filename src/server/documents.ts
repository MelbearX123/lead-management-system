import "server-only";
import { sql } from "./db";
import { HttpError } from "./http";
import { getLeadForUser } from "./leads";
import { paginate } from "./pagination";
import { loadFile, saveFile } from "./storage";
import type { Role, User } from "./users";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PDF_SIGNATURE = "%PDF-";

export type DocumentInfo = {
  documentId: number;
  fileName: string;
  sizeBytes: number;
  createdAt: Date;
  uploaderName: string;
  uploaderRole: Role;
};

export async function listDocuments(user: User, leadId: number, page: number) {
  await getLeadForUser(user, leadId);
  return paginate<DocumentInfo>({
    select: sql`
      SELECT documents.document_id, documents.file_name, documents.size_bytes, documents.created_at,
             users.fname || ' ' || users.lname AS uploader_name, users.role AS uploader_role
    `,
    from: sql`
      FROM documents JOIN users ON users.user_id = documents.uploaded_by
      WHERE documents.lead_id = ${leadId}
    `,
    orderBy: sql`documents.created_at DESC, documents.document_id DESC`,
    page,
  });
}

export async function addDocument(user: User, leadId: number, file: File) {
  await getLeadForUser(user, leadId);
  if (file.size > MAX_PDF_BYTES) throw new HttpError(400, "PDFs must be 10 MB or smaller");

  const data = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(data.subarray(0, PDF_SIGNATURE.length)) !== PDF_SIGNATURE) {
    throw new HttpError(400, "Only PDF files can be uploaded");
  }

  const fileName = file.name.slice(0, 255) || "document.pdf";
  const storageKey = await saveFile(data);
  const [document] = await sql<{ documentId: number }[]>`
    INSERT INTO documents ${sql({ leadId, uploadedBy: user.userId, fileName, storageKey, sizeBytes: data.length })}
    RETURNING document_id
  `;
  return document;
}

export async function readDocument(user: User, leadId: number, documentId: number) {
  await getLeadForUser(user, leadId);
  const [document] = await sql<{ fileName: string; storageKey: string }[]>`
    SELECT file_name, storage_key FROM documents WHERE document_id = ${documentId} AND lead_id = ${leadId}
  `;
  if (!document) throw new HttpError(404, "Document not found");
  return { fileName: document.fileName, data: await loadFile(document.storageKey) };
}
