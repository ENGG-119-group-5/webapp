"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { SearchType } from "@/lib/api/types";
import { useApi } from "@/lib/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { ResultList } from "./result-list";

const TYPES: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "technology", label: "Technologies" },
  { value: "patent", label: "Patents" },
  { value: "inventor", label: "Inventors" },
];

function parseType(value: string | null): SearchType {
  return TYPES.some((t) => t.value === value) ? (value as SearchType) : "all";
}

export function SearchView() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const type = parseType(params.get("type"));
  const [draft, setDraft] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);

  // Keep the box in sync when the URL changes (back/forward navigation).
  if (syncedQ !== q) {
    setSyncedQ(q);
    setDraft(q);
  }

  // With no query, show the shortlist of technologies ranked by IP potential.
  const effectiveType: SearchType = q ? type : type === "all" ? "technology" : type;
  const { data, error, loading, reload } = useApi(`search:${q}:${effectiveType}`, (signal) =>
    api.search(q, effectiveType, 50, signal),
  );

  function navigate(nextQ: string, nextType: SearchType) {
    const sp = new URLSearchParams();
    if (nextQ.trim()) sp.set("q", nextQ.trim());
    if (nextType !== "all") sp.set("type", nextType);
    const qs = sp.toString();
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Find technologies worth a closer look</h1>
        <p className="text-sm text-muted-foreground">
          Search Dartmouth TTO listings, linked USPTO patents and inventors. Every score and link is traceable to its source.
        </p>
      </div>

      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(draft, type);
        }}
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Search by technology, topic, patent number or inventor…"
            className="h-10 pl-8 text-base md:text-sm"
            aria-label="Search query"
            autoFocus
          />
        </div>
        <Button type="submit" className="h-10 px-4">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={type} onValueChange={(v) => navigate(q, parseType(v as string))}>
          <TabsList>
            {TYPES.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-3">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {loading
            ? "Searching…"
            : data
              ? q
                ? `${data.total} result${data.total === 1 ? "" : "s"} for “${q}”`
                : `Shortlist · ${data.total} ranked by IP potential`
              : ""}
        </p>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingRows />
      ) : data && data.hits.length ? (
        <ResultList hits={data.hits} showRelevance={!!q} />
      ) : (
        <EmptyState title={q ? `No results for “${q}”` : "No records yet"}>
          {q ? "Try a broader term, a patent number, or an inventor’s name." : "The data layer hasn’t loaded any records."}
        </EmptyState>
      )}
    </div>
  );
}
