import { z } from "zod";
import { signIn } from "@/server/auth";
import { parseBody, withErrors } from "@/server/http";

const loginSchema = z.object({ email: z.email(), password: z.string() });

export const POST = withErrors(async (request: Request) => {
  const { email, password } = await parseBody(request, loginSchema);
  return Response.json(await signIn(email, password));
});
