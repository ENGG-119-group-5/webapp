import type { MatchDecisionRequest } from "@/lib/api/types";
import { decideMatch } from "@/lib/mock/db";
import { handle, readJson } from "@/lib/mock/http";

export async function POST(req: Request, ctx: RouteContext<"/api/mock/review/matches/[id]">) {
  const { id } = await ctx.params;
  return handle(async () => decideMatch(id, await readJson<MatchDecisionRequest>(req)));
}
