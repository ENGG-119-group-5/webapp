import { unstable_rethrow } from "next/navigation";
import { NotFoundError, ValidationError } from "./db";

/** Runs a mock handler and maps thrown errors to JSON error responses. */
export async function handle(fn: () => unknown | Promise<unknown>): Promise<Response> {
  try {
    const result = await fn();
    return result instanceof Response ? result : Response.json(result);
  } catch (err) {
    unstable_rethrow(err); // let Next.js control-flow errors through
    if (err instanceof NotFoundError) return Response.json({ error: err.message }, { status: 404 });
    if (err instanceof ValidationError) return Response.json({ error: err.message }, { status: 422 });
    console.error("[mock api]", err);
    return Response.json({ error: "Internal mock API error" }, { status: 500 });
  }
}

export async function readJson<T>(req: Request): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    throw new ValidationError("Request body must be JSON");
  }
}
