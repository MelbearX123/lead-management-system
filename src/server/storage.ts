import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadsDir = path.join(process.cwd(), "uploads");

export async function saveFile(data: Uint8Array) {
  const storageKey = randomUUID();
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, storageKey), data);
  return storageKey;
}

export async function deleteAllFiles() {
  await rm(uploadsDir, { recursive: true, force: true });
}
