import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { homePath } from "@/server/pages";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? homePath(user.role) : "/login");
}
