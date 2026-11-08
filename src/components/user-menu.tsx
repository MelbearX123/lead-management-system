import { getCurrentUser } from "@/server/auth";
import { SignOutButton } from "./sign-out-button";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="flex items-center gap-4 text-sm">
      <span>
        {user.fname} {user.lname}
        <span className="text-gray-500"> · {user.firmName ?? user.role}</span>
      </span>
      <SignOutButton />
    </div>
  );
}
