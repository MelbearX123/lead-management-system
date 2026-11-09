"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, useState } from "react";
import { sendForm } from "@/lib/api";

export function UploadDocument({ leadId }: { leadId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    setError(null);
    setUploading(true);
    try {
      await sendForm(`/api/leads/${leadId}/documents`, form);
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <label
        className={`rounded bg-gray-900 px-3 py-1.5 text-white ${
          uploading ? "cursor-wait opacity-50" : "cursor-pointer hover:bg-gray-700"
        } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2`}
      >
        {uploading ? "Uploading…" : "Upload PDF"}
        <input
          type="file"
          accept="application/pdf"
          onChange={upload}
          disabled={uploading}
          className="sr-only"
        />
      </label>
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
