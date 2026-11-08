import { listCategories } from "@/server/lookups";

export async function GET() {
  return Response.json(await listCategories());
}
