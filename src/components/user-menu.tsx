import { capitalize } from "@/lib/format";
import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { SignOutButton } from "./sign-out-button";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span>
        {user.fname} {user.lname}
        <span className="text-gray-500"> · {user.firmName ?? capitalize(user.role)}</span>
      </span>
      <SignOutButton />
    </div>
  );
}
