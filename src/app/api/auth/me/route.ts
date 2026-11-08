import { requireUser } from "@/server/auth";
import { withErrors } from "@/server/http";

export const GET = withErrors(async () => Response.json(await requireUser()));
