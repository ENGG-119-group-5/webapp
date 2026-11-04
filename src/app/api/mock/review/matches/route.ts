import { connection, type NextRequest } from "next/server";
import type { MatchStatus } from "@/lib/api/types";
import { listMatches } from "@/lib/mock/db";
import { handle } from "@/lib/mock/http";

const STATUSES = ["pending", "match", "no_match", "all"] as const;

export async function GET(req: NextRequest) {
  await connection();
  return handle(() => {
    const param = req.nextUrl.searchParams.get("status") as MatchStatus | "all" | null;
    const status = param && STATUSES.includes(param) ? param : "pending";
    return { items: listMatches(status) };
  });
}
