"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendForm } from "@/lib/api";

export function UploadDocument({ leadId }: { leadId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function upload(form: FormData) {
    try {
      await sendForm(`/api/leads/${leadId}/documents`, form);
      setError(null);
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    }
  }

  return (
    <form action={upload} className="flex items-center gap-3 text-sm">
      <input name="file" type="file" accept="application/pdf" required />
      <button className="rounded bg-gray-900 px-3 py-1.5 text-white">Upload PDF</button>
      {error && <span className="text-red-600">{error}</span>}
    </form>
  );
}
