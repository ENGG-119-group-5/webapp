import { describe, expect, it } from "vitest";
import { readNdjson, toNdjsonStream } from "@/lib/api/stream";

function streamOf(chunks: string[]) {
  const enc = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(c) {
      chunks.forEach((s) => c.enqueue(enc.encode(s)));
      c.close();
    },
  });
}

async function collect<T>(gen: AsyncGenerator<T>) {
  const out: T[] = [];
  for await (const x of gen) out.push(x);
  return out;
}

describe("readNdjson", () => {
  it("handles lines split across chunks, blank lines and no trailing newline", async () => {
    const body = streamOf(['{"a":1}\n{"b"', ':2}\n\n', '{"c":3}']);
    expect(await collect(readNdjson(body))).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it("round-trips with toNdjsonStream", async () => {
    async function* src() {
      yield { type: "token", text: "hi " };
      yield { type: "done" };
    }
    expect(await collect(readNdjson(toNdjsonStream(src())))).toEqual([
      { type: "token", text: "hi " },
      { type: "done" },
    ]);
  });
});
