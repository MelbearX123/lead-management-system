import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? "uploads");

export async function saveFile(data: Uint8Array) {
  const storageKey = randomUUID();
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, storageKey), data);
  return storageKey;
}

export function loadFile(storageKey: string) {
  return readFile(path.join(uploadsDir, storageKey));
}

export async function deleteAllFiles() {
  await rm(uploadsDir, { recursive: true, force: true });
}
