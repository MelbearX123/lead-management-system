"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { sendJson } from "@/lib/api";

export function AddNote({ leadId }: { leadId: number }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setSaving(true);
    try {
      await sendJson(`/api/leads/${leadId}/notes`, "POST", { body: new FormData(form).get("body") });
      form.reset();
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <textarea
        name="body"
        required
        maxLength={5000}
        rows={3}
        placeholder="Add a private note"
        className="w-full rounded border bg-white px-3 py-2"
      />
      {error && <p className="text-red-600">{error}</p>}
      <button disabled={saving} className="rounded bg-gray-900 px-3 py-1.5 text-white disabled:opacity-50">
        {saving ? "Saving…" : "Add note"}
      </button>
    </form>
  );
}
