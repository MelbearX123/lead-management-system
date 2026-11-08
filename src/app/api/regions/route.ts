import { connection } from "next/server";
import { listRegions } from "@/server/lookups";

export async function GET() {
  await connection();
  return Response.json(await listRegions());
}
