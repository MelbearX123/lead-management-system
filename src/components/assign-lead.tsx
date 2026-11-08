"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { sendJson } from "@/lib/api";

type Firm = { firmId: number; name: string };

type Props = { leadId: number; currentFirmId: number | null; firms: Firm[] };

export function AssignLead({ leadId, currentFirmId, firms }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const reassigning = currentFirmId !== null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const firmId = Number(new FormData(event.currentTarget).get("firmId"));
    if (reassigning && !confirm("Move this lead? The current firm loses access and the new firm must accept it.")) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await sendJson(`/api/leads/${leadId}/assign`, "POST", { firmId });
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3 rounded border bg-white p-4 text-sm">
      <span className="mr-auto">
        {reassigning ? "Move this lead to a different firm." : "This lead is waiting for a firm."}
      </span>
      <select name="firmId" aria-label="Firm" required defaultValue="" className="rounded border px-2 py-1.5">
        <option value="" disabled>
          Choose a firm
        </option>
        {firms
          .filter((firm) => firm.firmId !== currentFirmId)
          .map((firm) => (
            <option key={firm.firmId} value={firm.firmId}>
              {firm.name}
            </option>
          ))}
      </select>
      <button disabled={busy} className="rounded bg-gray-900 px-3 py-1.5 text-white disabled:opacity-50">
        {reassigning ? "Reassign" : "Assign"}
      </button>
      {error && <p className="w-full text-red-600">{error}</p>}
    </form>
  );
}
