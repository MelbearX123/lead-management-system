import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "./db";
import { addDocument, listDocuments, readDocument } from "./documents";
import { listHistory } from "./history";
import { addNote, listNotes } from "./notes";
import { findUserByEmail, type User } from "./users";

const REASSIGNED_LEAD = 5;
const FIRM_B_LEAD = 6;
const FIRM_B_LEAD_DOCUMENT = 2;

let maya: User;
let jordan: User;
let avery: User;
let sam: User;
let riley: User;
let samplePdf: Uint8Array<ArrayBuffer>;

beforeAll(async () => {
  [maya, jordan, avery, sam, riley] = await Promise.all(
    ["maya", "jordan", "avery", "sam", "riley"].map((name) => seededUser(`${name}@example.com`)),
  );
  samplePdf = new Uint8Array(await readFile("db/sample.pdf"));
});

afterAll(() => sql.end());

async function seededUser(email: string) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`No seeded user ${email}`);
  return user;
}

describe("documents", () => {
  it("are visible to the new firm after a reassignment", async () => {
    const { items } = await listDocuments(sam, REASSIGNED_LEAD, 1);
    expect(items.map((document) => document.fileName)).toContain("hospital-discharge-summary.pdf");
  });

  it("are hidden from the old firm", async () => {
    await expect(listDocuments(avery, REASSIGNED_LEAD, 1)).rejects.toMatchObject({ status: 404 });
  });

  it("can be uploaded and read back", async () => {
    const { documentId } = await addDocument(jordan, FIRM_B_LEAD, new File([samplePdf], "scan.pdf"));
    const { fileName, data } = await readDocument(sam, FIRM_B_LEAD, documentId);
    expect(fileName).toBe("scan.pdf");
    expect(data.equals(samplePdf)).toBe(true);
  });

  it("must be PDFs", async () => {
    await expect(addDocument(jordan, FIRM_B_LEAD, new File(["hello"], "fake.pdf"))).rejects.toMatchObject({
      status: 400,
    });
  });

  it("must be 10 MB or smaller", async () => {
    const tooBig = new File([samplePdf, new Uint8Array(10 * 1024 * 1024)], "big.pdf");
    await expect(addDocument(jordan, FIRM_B_LEAD, tooBig)).rejects.toMatchObject({ status: 400 });
  });

  it("are only found through their own lead", async () => {
    await expect(readDocument(riley, REASSIGNED_LEAD, FIRM_B_LEAD_DOCUMENT)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("notes", () => {
  it("stay with the firm that wrote them after a reassignment", async () => {
    const { items } = await listNotes(sam, REASSIGNED_LEAD, 1);
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((note) => note.firmName === "Pacific Shore Legal")).toBe(true);
  });

  it("from every firm are visible to admins", async () => {
    const { items } = await listNotes(riley, REASSIGNED_LEAD, 1);
    expect(new Set(items.map((note) => note.firmName))).toEqual(
      new Set(["Alder & Finch LLP", "Pacific Shore Legal"]),
    );
  });

  it("are never returned to plaintiffs", async () => {
    const { items } = await listNotes(maya, REASSIGNED_LEAD, 1);
    expect(items).toEqual([]);
  });

  it("belong to the author's firm", async () => {
    const { noteId } = await addNote(sam, FIRM_B_LEAD, "Filed the complaint.");
    const { items } = await listNotes(riley, FIRM_B_LEAD, 1);
    expect(items.find((note) => note.noteId === noteId)).toMatchObject({ firmName: "Pacific Shore Legal" });
  });
});

describe("history", () => {
  it("lists a lead's changes oldest first, starting with routing", async () => {
    const { items, total } = await listHistory(riley, REASSIGNED_LEAD, 1);
    expect(total).toBe(8);
    expect(items[0]).toMatchObject({ field: "firm", oldValue: null, newValue: "1", actorName: null });
    expect(items[4]).toMatchObject({ field: "firm", oldValue: "1", newValue: "2", actorName: "Riley Morgan" });
  });
});
