import Link from "next/link";
import { CheckIcon, CircleAlertIcon } from "lucide-react";
import type { MatchLabel, TechnologyMatch } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { ScorePill } from "@/components/badges";

export const LABEL_TEXT: Record<MatchLabel, string> = {
  strong: "Strong match",
  potential: "Potential match",
  none: "No relevance",
};

export function LabelBadge({ label }: { label: MatchLabel }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold",
        label === "strong" && "bg-primary text-primary-foreground",
        label === "potential" && "bg-warning/25 text-foreground",
        label === "none" && "bg-muted text-muted-foreground",
      )}
    >
      {LABEL_TEXT[label]}
    </span>
  );
}

function ScoreDots({ score }: { score: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${score} of 2`}>
      {[0, 1].map((i) => (
        <span key={i} className={cn("size-2 rounded-full", i < score ? "bg-primary" : "bg-muted-foreground/25")} />
      ))}
    </span>
  );
}

/**
 * One technology's match: label, scores, and the quoted evidence behind each score.
 *
 * In plain words: each card shows the invention's name (click it for details), its label
 * (Strong / Potential / No relevance), its total out of 8, and its IP score. Below that,
 * four boxes (area, problem, stage, deal) each show 0–2 dots, Claude's reason, and the
 * quote Claude gave as proof. A green tick means our code found that quote in the
 * invention's record. An orange warning means it did not, so treat that reason with care.
 */
export function MatchCard({ match, rank }: { match: TechnologyMatch; rank: number }) {
  const { technology: t } = match;
  return (
    <li className="rounded-xl border bg-card p-4" data-testid="match-card">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <span className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">{rank}</span>
        <div className="min-w-0 flex-1">
          <Link href={`/technology/${encodeURIComponent(t.id)}`} className="font-medium hover:underline">
            {t.title}
          </Link>
          <div className="text-xs text-muted-foreground">
            {t.ttoCaseNumber}
            {match.category && ` · ${match.category}`}
          </div>
        </div>
        <LabelBadge label={match.label} />
        <span className="font-mono text-sm tabular-nums" title="Total fit score (4 fits × 0–2)">
          {match.totalScore}/8
        </span>
        {t.ipScore != null && <ScorePill score={t.ipScore} />}
      </div>
      <p className="mt-2 text-sm">{match.summary}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {match.fits.map((f) => (
          <div key={f.key} className="rounded-lg bg-muted/50 p-2.5 text-xs">
            <dt className="flex items-center justify-between gap-2 font-medium capitalize" title={f.question}>
              {f.key} fit <ScoreDots score={f.score} />
            </dt>
            <dd className="mt-1 flex flex-col gap-1">
              <span>{f.reason}</span>
              {f.quote && (
                <span className="flex gap-1 text-muted-foreground">
                  {f.quoteVerified ? (
                    <CheckIcon className="mt-0.5 size-3 shrink-0 text-success" aria-label="Quote found in the record" />
                  ) : (
                    <CircleAlertIcon className="mt-0.5 size-3 shrink-0 text-warning" aria-label="Quote not found in the record" />
                  )}
                  <q className="italic">{f.quote}</q>
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
