/**
 * Reads a newline-delimited JSON (NDJSON) stream and yields one parsed object
 * per line. Handles lines split across chunks and a trailing line without "\n".
 */
export async function* readNdjson<T>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) yield JSON.parse(line) as T;
      }
    }
    buffer += decoder.decode();
    const rest = buffer.trim();
    if (rest) yield JSON.parse(rest) as T;
  } finally {
    reader.releaseLock();
  }
}

/** Encodes objects as an NDJSON byte stream (used by the mock API). */
export function toNdjsonStream<T>(
  source: AsyncIterable<T>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = source[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(JSON.stringify(value) + "\n"));
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}
