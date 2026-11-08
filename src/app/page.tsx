import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/server/auth";
import { homePath } from "@/server/pages";

export default function Home() {
  return (
    <Suspense>
      <RedirectToHome />
    </Suspense>
  );
}

async function RedirectToHome() {
  const user = await getCurrentUser();
  return redirect(user ? homePath(user.role) : "/login");
}
