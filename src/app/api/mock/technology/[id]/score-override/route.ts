import type { ScoreOverrideRequest } from "@/lib/api/types";
import { overrideScore } from "@/lib/mock/db";
import { handle, readJson } from "@/lib/mock/http";

export async function POST(req: Request, ctx: RouteContext<"/api/mock/technology/[id]/score-override">) {
  const { id } = await ctx.params;
  return handle(async () => overrideScore(id, await readJson<ScoreOverrideRequest>(req)));
}
