import { connection } from "next/server";
import { MOCK_PDF, MOCK_SAMPLES } from "@/lib/mock/match";

export async function GET(_req: Request, ctx: RouteContext<"/api/mock/samples/[name]">) {
  await connection();
  const { name } = await ctx.params;
  if (!MOCK_SAMPLES.some((s) => s.name === name)) {
    return Response.json({ error: `No sample thesis '${name}'` }, { status: 404 });
  }
  return new Response(MOCK_PDF, { headers: { "Content-Type": "application/pdf" } });
}
