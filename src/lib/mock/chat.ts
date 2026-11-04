/**
 * Canned chat responder for the mock API. Builds a short answer from the
 * search results, with numbered citations, then streams it word by word.
 * The real orchestrator (graph search / IP potential / similarity / RAG
 * summary) replaces this later.
 */
import type { ChatEvent, ChatRequest, Citation } from "@/lib/api/types";
import { getInventor, getPatent, getTechnology, search } from "./db";
import { ttoSource, usptoSource } from "./fixtures";

const STOP_WORDS = new Set(
  "a an and are about any can do does for from give how i in is it me of on or show tell than that the their there these this to what which who with about".split(
    " ",
  ),
);

export function buildAnswer(message: string): { text: string; citations: Citation[] } {
  const query = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(" ");
  const hits = query ? search(query, "all", 3).hits.filter((h) => h.relevance >= 0.5) : [];

  if (!hits.length) {
    return {
      text:
        "I couldn't find anything in the sample data that matches that question. " +
        'Try naming a technology (e.g. "Technology A"), a topic such as "imaging" or "energy", or an inventor.',
      citations: [],
    };
  }

  const citations: Citation[] = [];
  const lines = hits.map((hit, idx) => {
    const n = idx + 1;
    if (hit.type === "technology") {
      const t = getTechnology(hit.id);
      citations.push({ n, type: "technology", id: t.id, label: t.title, source: ttoSource(t.ttoCaseNumber) });
      return `${t.title} (${t.ttoCaseNumber}) is a ${t.categories.join(" / ").toLowerCase()} technology with ${t.patents.length} linked patent${t.patents.length === 1 ? "" : "s"} and an IP-potential score of ${t.ipScore.effective} [${n}].`;
    }
    if (hit.type === "patent") {
      const p = getPatent(hit.id);
      citations.push({ n, type: "patent", id: p.id, label: p.number, source: usptoSource(p.number) });
      return `${p.number} "${p.title}" was granted ${p.grantedAt ?? "(not yet granted)"} and has ${p.forwardCitations} forward citations [${n}].`;
    }
    const i = getInventor(hit.id);
    citations.push({ n, type: "inventor", id: i.id, label: i.name });
    return `${i.name} is listed as an inventor on ${i.patents.length} patent${i.patents.length === 1 ? "" : "s"} linked to ${i.technologies.length} technolog${i.technologies.length === 1 ? "y" : "ies"} [${n}].`;
  });

  return {
    text:
      `Here is what the sample data shows:\n\n${lines.map((l) => `• ${l}`).join("\n")}\n\n` +
      "(Mock answer: the real orchestrator will route this question to graph search, IP potential, similarity and summary tools.)",
    citations,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function* streamAnswer(req: ChatRequest, delayMs = 20): AsyncGenerator<ChatEvent> {
  const { text, citations } = buildAnswer(req.message);
  for (const citation of citations) yield { type: "citation", citation };
  // Split into words, keeping whitespace attached so the client can just concatenate.
  for (const token of text.match(/\S+\s*|\s+/g) ?? []) {
    if (delayMs) await sleep(delayMs);
    yield { type: "token", text: token };
  }
  yield { type: "done" };
}
