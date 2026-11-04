import { connection } from "next/server";
import { getTechnology } from "@/lib/mock/db";
import { handle } from "@/lib/mock/http";

export async function GET(_req: Request, ctx: RouteContext<"/api/mock/technology/[id]">) {
  await connection();
  const { id } = await ctx.params;
  return handle(() => getTechnology(id));
}
