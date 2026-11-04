import { connection } from "next/server";
import { getPatent } from "@/lib/mock/db";
import { handle } from "@/lib/mock/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/mock/patent/[id]">) {
  await connection();
  const { id } = await ctx.params;
  return handle(() => getPatent(id));
}
