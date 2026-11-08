import { signOut } from "@/server/auth";

export async function POST() {
  await signOut();
  return new Response(null, { status: 204 });
}
