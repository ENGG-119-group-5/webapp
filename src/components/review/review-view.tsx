"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { MatchStatus } from "@/lib/api/types";
import { useAnalyst } from "@/lib/analyst";
import { useApi } from "@/lib/use-api";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { MatchReviewCard } from "./match-review-card";

const TABS: { value: MatchStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "match", label: "Confirmed" },
  { value: "no_match", label: "Rejected" },
];

export function ReviewView() {
  const [status, setStatus] = useState<MatchStatus>("pending");
  const [analyst] = useAnalyst();
  const { data, error, loading, reload, setData } = useApi(`matches:${status}`, (signal) =>
    api.listMatches(status, signal),
  );

  async function decide(matchId: string, decision: "match" | "no_match", note: string) {
    if (!analyst.trim()) {
      toast.error("Enter your analyst name (top right) before deciding.");
      return;
    }
    try {
      const updated = await api.decideMatch(matchId, { decision, analyst: analyst.trim(), note: note.trim() || undefined });
      toast.success(
        decision === "match"
          ? `Linked ${updated.technology.title} to ${updated.patent.number}`
          : `Rejected ${updated.technology.title} ↔ ${updated.patent.number}`,
      );
      if (data) setData({ items: data.items.filter((m) => m.id !== matchId) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save decision");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Match review</h1>
        <p className="text-sm text-muted-foreground">
          Entity resolution couldn’t decide these TTO ↔ patent links on its own. Confirm or reject each one; decisions are logged.
        </p>
      </div>

      <Tabs value={status} onValueChange={(v) => setStatus(v as MatchStatus)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-3">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading || !data ? (
        <LoadingRows rows={3} />
      ) : data.items.length ? (
        <div className="flex flex-col gap-3">
          {data.items.map((m) => (
            <MatchReviewCard
              key={m.id}
              match={m}
              onDecide={status === "pending" ? (d, note) => decide(m.id, d, note) : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState title={status === "pending" ? "Queue is clear" : "Nothing here yet"}>
          {status === "pending" ? "No uncertain matches are waiting for review." : "Decided matches will appear here."}
        </EmptyState>
      )}
    </div>
  );
}
