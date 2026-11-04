"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckIcon, SparklesIcon, XIcon } from "lucide-react";
import type { MatchCandidate } from "@/lib/api/types";
import { formatDate, formatDateTime, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EntityIcon } from "@/components/badges";

function Side({ type, href, title, subtitle }: { type: "technology" | "patent"; href: string; title: string; subtitle: string }) {
  return (
    <Link href={href} className="flex min-w-0 flex-1 items-start gap-2 rounded-md border p-2.5 hover:bg-muted/60">
      <EntityIcon type={type} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
          {type === "technology" ? "TTO technology" : "USPTO patent"}
        </span>
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </Link>
  );
}

export function MatchReviewCard({
  match,
  onDecide,
}: {
  match: MatchCandidate;
  onDecide?: (decision: "match" | "no_match", note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"match" | "no_match" | null>(null);

  async function decide(decision: "match" | "no_match") {
    if (!onDecide) return;
    setBusy(decision);
    try {
      await onDecide(decision, note);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card size="sm" data-testid="match-card">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Side
            type="technology"
            href={`/technology/${match.technology.id}`}
            title={match.technology.title}
            subtitle={match.technology.ttoCaseNumber}
          />
          <div className="flex shrink-0 flex-col items-center px-1 text-center">
            <span
              className={cn(
                "font-mono text-lg font-semibold tabular-nums",
                match.confidence >= 0.6 ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {formatPercent(match.confidence)}
            </span>
            <span className="text-[11px] text-muted-foreground">confidence</span>
          </div>
          <Side
            type="patent"
            href={`/patent/${match.patent.id}`}
            title={match.patent.number}
            subtitle={`${match.patent.title} · granted ${formatDate(match.patent.grantedAt)}`}
          />
        </div>

        <table className="w-full text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="py-1 text-left font-medium">Field</th>
              <th className="py-1 text-left font-medium">TTO listing</th>
              <th className="py-1 text-left font-medium">USPTO record</th>
              <th className="py-1 text-right font-medium">Similarity</th>
            </tr>
          </thead>
          <tbody>
            {match.comparisons.map((c) => (
              <tr key={c.field} className="border-b last:border-0">
                <td className="py-1.5 pr-2 font-medium">{c.field}</td>
                <td className="py-1.5 pr-2">{c.left}</td>
                <td className="py-1.5 pr-2">{c.right}</td>
                <td className="py-1.5 text-right font-mono tabular-nums">{formatPercent(c.similarity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {match.judgeRationale && (
          <div className="flex gap-2 rounded-md bg-muted/60 p-2.5 text-xs">
            <SparklesIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <p>{match.judgeRationale}</p>
          </div>
        )}

        {match.status === "pending" && onDecide ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Textarea
              rows={1}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the audit log"
              aria-label="Decision note"
              className="min-h-8 flex-1 text-xs"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={!!busy} onClick={() => decide("no_match")}>
                <XIcon /> {busy === "no_match" ? "Saving…" : "Not a match"}
              </Button>
              <Button size="sm" disabled={!!busy} onClick={() => decide("match")}>
                <CheckIcon /> {busy === "match" ? "Saving…" : "Confirm match"}
              </Button>
            </div>
          </div>
        ) : (
          match.decision && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{match.status === "match" ? "Confirmed match" : "Rejected"}</span>{" "}
              by {match.decision.analyst} · {formatDateTime(match.decision.at)}
              {match.decision.note && <> · “{match.decision.note}”</>}
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
