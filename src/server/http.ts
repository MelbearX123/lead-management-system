import postgres from "postgres";
import { z } from "zod";

const FOREIGN_KEY_VIOLATION = "23503";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function withErrors<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof HttpError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof postgres.PostgresError && error.code === FOREIGN_KEY_VIOLATION) {
        return Response.json({ error: "Referenced record does not exist" }, { status: 400 });
      }
      throw error;
    }
  };
}

export function parseInput<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, z.prettifyError(result.error));
  return result.data;
}

export async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  return parseInput(schema, await request.json().catch(() => null));
}

export function parseQuery<T>(request: Request, schema: z.ZodType<T>) {
  return parseInput(schema, Object.fromEntries(new URL(request.url).searchParams));
}

export function parseId(value: string) {
  return parseInput(z.coerce.number().int().positive().max(2 ** 31 - 1), value);
}
