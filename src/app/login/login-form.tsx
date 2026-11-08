"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { sendJson } from "@/lib/api";

type DemoAccount = { email: string; label: string };

export function LoginForm({ demoAccounts, demoPassword }: { demoAccounts: DemoAccount[]; demoPassword: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    signIn(String(form.get("email")), String(form.get("password")));
  }

  async function signIn(email: string, password: string) {
    try {
      await sendJson("/api/auth/login", "POST", { email, password });
      router.push("/");
      router.refresh();
    } catch (failure) {
      setError((failure as Error).message);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="space-y-3">
        <input name="email" type="email" placeholder="Email" required className="w-full rounded border px-3 py-2" />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          className="w-full rounded border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-gray-900 px-3 py-2 text-white">Sign in</button>
      </form>

      <div>
        <h2 className="mb-2 text-sm font-medium text-gray-600">Demo accounts (password: {demoPassword})</h2>
        <ul className="divide-y rounded border bg-white">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <button
                onClick={() => signIn(account.email, demoPassword)}
                className="flex w-full justify-between px-3 py-2 text-left hover:bg-gray-50"
              >
                <span>{account.email}</span>
                <span className="text-gray-500">{account.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
