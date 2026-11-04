"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { ChatMessage, Citation } from "@/lib/api/types";
import { entityHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EntityIcon } from "@/components/badges";
import { CitationText } from "@/components/citation-text";
import { SourceLink } from "@/components/source-link";

interface Turn extends ChatMessage {
  citations: Citation[];
  error?: string;
  streaming?: boolean;
}

const SUGGESTIONS = [
  "Which imaging technologies are available for licensing?",
  "Tell me about energy materials",
  "What has Inventor Three worked on?",
];

export function ChatView() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streaming = turns.some((t) => t.streaming);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function updateLast(fn: (t: Turn) => Turn) {
    setTurns((ts) => [...ts.slice(0, -1), fn(ts[ts.length - 1])]);
  }

  async function send(message: string) {
    const text = message.trim();
    if (!text || streaming) return;
    const history: ChatMessage[] = turns
      .filter((t) => !t.error)
      .map(({ role, content }) => ({ role, content }));
    setDraft("");
    setTurns((ts) => [
      ...ts,
      { role: "user", content: text, citations: [] },
      { role: "assistant", content: "", citations: [], streaming: true },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for await (const event of api.chat({ message: text, history }, controller.signal)) {
        if (event.type === "token") updateLast((t) => ({ ...t, content: t.content + event.text }));
        else if (event.type === "citation") updateLast((t) => ({ ...t, citations: [...t.citations, event.citation] }));
        else if (event.type === "error") updateLast((t) => ({ ...t, error: event.message }));
        else if (event.type === "done") break;
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        updateLast((t) => ({ ...t, error: err instanceof Error ? err.message : "Chat request failed" }));
      }
    } finally {
      updateLast((t) => ({ ...t, streaming: false }));
      abortRef.current = null;
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-3xl flex-col">
      <div className="flex-1 overflow-y-auto pb-4" aria-live="polite">
        {!turns.length ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Ask about the research landscape</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Every statement in an answer cites the record it came from. Click a number to open it.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-5">
            {turns.map((t, i) => (
              <li key={i} className={cn("flex", t.role === "user" && "justify-end")} data-testid={`chat-${t.role}`}>
                {t.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {t.content}
                  </div>
                ) : (
                  <div className="flex w-full flex-col gap-2 text-sm">
                    {t.content ? (
                      <CitationText text={t.content} citations={t.citations} />
                    ) : (
                      t.streaming && <span className="animate-pulse text-muted-foreground">Thinking…</span>
                    )}
                    {t.error && (
                      <p role="alert" className="text-destructive">
                        {t.error}
                      </p>
                    )}
                    {!!t.citations.length && !t.streaming && (
                      <ol className="flex flex-col gap-1 border-t pt-2" data-testid="citations">
                        {t.citations.map((c) => (
                          <li key={c.n} className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-mono text-muted-foreground">[{c.n}]</span>
                            <Link href={entityHref(c)} className="inline-flex items-center gap-1 font-medium hover:underline">
                              <EntityIcon type={c.type} className="size-3.5" />
                              {c.label}
                            </Link>
                            {c.source && <SourceLink source={c.source} />}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="flex items-end gap-2 rounded-xl border bg-background p-2 shadow-xs focus-within:ring-2 focus-within:ring-ring/40"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(draft);
            }
          }}
          rows={1}
          placeholder="Ask a question about technologies, patents or inventors…"
          aria-label="Chat message"
          className="max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        {streaming ? (
          <Button type="button" size="icon" variant="outline" aria-label="Stop" onClick={() => abortRef.current?.abort()}>
            <SquareIcon />
          </Button>
        ) : (
          <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
            <ArrowUpIcon />
          </Button>
        )}
      </form>
    </div>
  );
}
