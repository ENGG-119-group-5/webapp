import type { MatchLabel, MatchResponse } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { LABEL_TEXT, MatchCard } from "./match-card";

/** Thesis summary, counts per label, then the ranked matches ("No relevance" collapsed). */
export function MatchResults({ result }: { result: MatchResponse }) {
  const relevant = result.matches.filter((m) => m.label !== "none");
  const none = result.matches.filter((m) => m.label === "none");
  const count = (label: MatchLabel) => result.matches.filter((m) => m.label === label).length;

  return (
    <div className="flex flex-col gap-4" data-testid="match-results">
      <div className="rounded-xl border bg-card p-4">
        <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">What the thesis looks for</div>
        <p className="mt-1 text-sm">{result.thesisSummary}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {result.thesisName} · {result.matches.length} technologies assessed by {result.model}
          {result.source === "saved_demo" ? " · saved result for a sample thesis" : ` · ${formatDateTime(result.generatedAt)}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm" data-testid="match-counts">
        {(["strong", "potential", "none"] as const).map((l) => (
          <span key={l} className="rounded-full border px-3 py-1">
            {LABEL_TEXT[l]}: <span className="font-semibold tabular-nums">{count(l)}</span>
          </span>
        ))}
      </div>

      <ol className="flex flex-col gap-3">
        {relevant.map((m, i) => (
          <MatchCard key={m.technology.id} match={m} rank={i + 1} />
        ))}
      </ol>

      {none.length > 0 && (
        <details className="rounded-xl border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            {none.length} technologies with no relevance to this thesis
          </summary>
          <ol className="mt-3 flex flex-col gap-3">
            {none.map((m, i) => (
              <MatchCard key={m.technology.id} match={m} rank={relevant.length + i + 1} />
            ))}
          </ol>
        </details>
      )}

      {result.unassessedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Not assessed by the model: {result.unassessedIds.join(", ")}
        </p>
      )}
    </div>
  );
}
