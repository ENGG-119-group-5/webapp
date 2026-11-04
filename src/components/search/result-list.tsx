import Link from "next/link";
import type { SearchHit } from "@/lib/api/types";
import { formatPercent } from "@/lib/format";
import { ENTITY_LABEL, entityHref } from "@/lib/routes";
import { EntityIcon, ScorePill } from "@/components/badges";

export function ResultList({ hits, showRelevance }: { hits: SearchHit[]; showRelevance: boolean }) {
  return (
    <ul className="divide-y rounded-lg border" data-testid="results">
      {hits.map((hit, idx) => (
        <li key={`${hit.type}:${hit.id}`}>
          <Link
            href={entityHref(hit)}
            className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60"
            data-testid="result-row"
          >
            <span className="w-5 pt-0.5 text-right font-mono text-xs text-muted-foreground tabular-nums">{idx + 1}</span>
            <EntityIcon type={hit.type} className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="truncate font-medium">{hit.title}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {ENTITY_LABEL[hit.type]}
                </span>
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{hit.snippet}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3">
              {showRelevance && (
                <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline" title="Match to query">
                  {formatPercent(hit.relevance)}
                </span>
              )}
              {hit.ipScore !== undefined && <ScorePill score={hit.ipScore} />}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
