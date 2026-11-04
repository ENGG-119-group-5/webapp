import { connection } from "next/server";
import { getInventor } from "@/lib/mock/db";
import { handle } from "@/lib/mock/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/mock/inventor/[id]">) {
  await connection();
  const { id } = await ctx.params;
  return handle(() => getInventor(id));
}
