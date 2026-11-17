import { connection } from "next/server";
import { MOCK_SAMPLES } from "@/lib/mock/match";

export async function GET() {
  await connection();
  return Response.json(MOCK_SAMPLES);
}
