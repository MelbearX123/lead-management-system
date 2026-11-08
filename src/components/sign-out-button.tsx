"use client";

import { useRouter } from "next/navigation";
import { sendJson } from "@/lib/api";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await sendJson("/api/auth/logout", "POST");
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="text-sm text-gray-600 hover:text-gray-900">
      Sign out
    </button>
  );
}
