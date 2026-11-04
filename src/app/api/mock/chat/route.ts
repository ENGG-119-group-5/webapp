import type { ChatRequest } from "@/lib/api/types";
import { streamAnswer } from "@/lib/mock/chat";
import { ValidationError } from "@/lib/mock/db";
import { handle, readJson } from "@/lib/mock/http";
import { toNdjsonStream } from "@/lib/api/stream";

export async function POST(req: Request) {
  return handle(async () => {
    const body = await readJson<ChatRequest>(req);
    if (typeof body.message !== "string" || !body.message.trim()) {
      throw new ValidationError("`message` is required");
    }
    const stream = toNdjsonStream(
      streamAnswer({ message: body.message, history: body.history ?? [] }),
    );
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  });
}
