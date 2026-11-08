import { connection } from "next/server";
import { listCategories } from "@/server/lookups";

export async function GET() {
  await connection();
  return Response.json(await listCategories());
}
