import { connection, type NextRequest } from "next/server";
import type { SearchType } from "@/lib/api/types";
import { search } from "@/lib/mock/db";
import { handle } from "@/lib/mock/http";

const TYPES: SearchType[] = ["all", "technology", "patent", "inventor"];

export async function GET(req: NextRequest) {
  await connection();
  return handle(() => {
    const params = req.nextUrl.searchParams;
    const q = params.get("q") ?? "";
    const typeParam = params.get("type") as SearchType | null;
    const type = typeParam && TYPES.includes(typeParam) ? typeParam : "all";
    const limit = Math.min(100, Math.max(1, Number(params.get("limit")) || 25));
    return search(q, type, limit);
  });
}
