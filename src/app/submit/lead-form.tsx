"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { sendJson } from "@/lib/api";

type Option = { id: string; name: string };

type Props = { regions: Option[]; categories: Option[]; demoPassword: string };

type Submitted = { email: string; routed: boolean };

const inputClass = "w-full rounded border bg-white px-3 py-2";

export function LeadForm({ regions, categories, demoPassword }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lead = Object.fromEntries(new FormData(event.currentTarget));
    setError(null);
    setSubmitting(true);
    try {
      const response = await sendJson("/api/leads", "POST", lead);
      const { firmId } = await response.json();
      setSubmitted({ email: String(lead.email), routed: firmId !== null });
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-3 rounded border bg-white p-6">
        <h2 className="text-lg font-semibold">We received your lead</h2>
        <p>
          {submitted.routed
            ? "It has been sent to a law firm for review."
            : "We'll match it with a law firm shortly."}
        </p>
        <p className="text-sm text-gray-600">
          To follow its progress and share documents, <Link href="/login" className="underline">sign in</Link> with{" "}
          {submitted.email} and the password <code>{demoPassword}</code>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name">
          <input name="fname" required maxLength={100} className={inputClass} />
        </Field>
        <Field label="Last name">
          <input name="lname" required maxLength={100} className={inputClass} />
        </Field>
      </div>
      <Field label="Email">
        <input name="email" type="email" required className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="State">
          <Select name="regionId" options={regions} />
        </Field>
        <Field label="Type of case">
          <Select name="categoryId" options={categories} />
        </Field>
      </div>
      <Field label="Short summary">
        <input name="title" required maxLength={200} className={inputClass} />
      </Field>
      <Field label="What happened?">
        <textarea name="description" required maxLength={5000} rows={6} className={inputClass} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50">
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-gray-600">{label}</span>
      {children}
    </label>
  );
}

function Select({ name, options }: { name: string; options: Option[] }) {
  return (
    <select name={name} required defaultValue="" className={inputClass}>
      <option value="" disabled>
        Choose one
      </option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
