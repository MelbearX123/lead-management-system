import { listRegions } from "@/server/lookups";

export async function GET() {
  return Response.json(await listRegions());
}
