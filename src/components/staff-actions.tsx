"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/api";
import { capitalize } from "@/lib/format";
import { type LeadStatus, type Progress, progressStages } from "@/lib/lead-states";

type Props = { leadId: number; status: LeadStatus; progress: Progress | null };

export function StaffActions({ leadId, status, progress }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shownProgress, setShownProgress] = useState(progress);

  async function change(path: string, method: string, data?: unknown) {
    setError(null);
    setBusy(true);
    try {
      await sendJson(`/api/leads/${leadId}/${path}`, method, data);
      return true;
    } catch (failure) {
      setError((failure as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function accept() {
    if (await change("accept", "POST")) router.refresh();
  }

  async function decline() {
    if (!confirm("Decline this lead? It goes back to an admin and leaves your inbox.")) return;
    if (await change("decline", "POST")) router.push("/inbox");
  }

  async function updateProgress(next: Progress) {
    setShownProgress(next);
    if (await change("progress", "PATCH", { progress: next })) router.refresh();
    else setShownProgress(progress);
  }

  return (
    <section className="flex flex-wrap items-center gap-3 rounded border bg-white p-4 text-sm">
      {status === "pending" ? (
        <>
          <span className="mr-auto">This lead is waiting for your firm.</span>
          <button onClick={accept} disabled={busy} className="rounded bg-green-700 px-3 py-1.5 text-white disabled:opacity-50">
            Accept
          </button>
          <button onClick={decline} disabled={busy} className="rounded border px-3 py-1.5 disabled:opacity-50">
            Decline
          </button>
        </>
      ) : (
        <label className="flex items-center gap-2">
          Case progress
          <select
            value={shownProgress ?? undefined}
            onChange={(event) => updateProgress(event.target.value as Progress)}
            disabled={busy}
            className="rounded border px-2 py-1.5"
          >
            {progressStages.map((stage) => (
              <option key={stage} value={stage}>
                {capitalize(stage)}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="w-full text-red-600">{error}</p>}
    </section>
  );
}
