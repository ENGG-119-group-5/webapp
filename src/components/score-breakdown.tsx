import type { IpScore } from "@/lib/api/types";
import { formatDateTime, formatPercent, formatScore } from "@/lib/format";
import { sumContributions } from "@/lib/validation";
import { SourceLink } from "./source-link";

/**
 * Transparent IP-potential score: every indicator's value, weight and
 * contribution, so analysts can see exactly why a technology scores as it does.
 *
 * In plain words: the big number is the IP score (0–100). The table lists the six checks
 * that make it up, what each one found, how much it can be worth, and how many points it
 * earned. The points add up to the total. If an analyst changed the score by hand, a note
 * shows who did it, when, and why, and the original computed score is still shown.
 */
export function ScoreBreakdown({ ipScore }: { ipScore: IpScore }) {
  const total = sumContributions(ipScore.indicators);
  const mismatch = Math.abs(total - ipScore.computed) > 0.11;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-4xl font-semibold tracking-tight tabular-nums" data-testid="effective-score">
            {formatScore(ipScore.effective)}
          </div>
          <div className="text-xs text-muted-foreground">
            {ipScore.override ? (
              <>
                Analyst override · computed <span className="font-mono">{formatScore(ipScore.computed)}</span>
              </>
            ) : (
              "Computed from the indicators below"
            )}
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground">{ipScore.rubric}</span>
      </div>

      {ipScore.override && (
        <div className="rounded-md border border-warning/50 bg-warning/10 p-2.5 text-xs" data-testid="override-note">
          <span className="font-medium">{ipScore.override.analyst}</span> set the score to{" "}
          <span className="font-mono font-medium">{formatScore(ipScore.override.score)}</span> on{" "}
          {formatDateTime(ipScore.override.at)}: “{ipScore.override.reason}”
        </div>
      )}

      <table className="w-full text-xs">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="py-1.5 text-left font-medium">Indicator</th>
            <th className="py-1.5 text-right font-medium">Weight</th>
            <th className="py-1.5 text-right font-medium">Points</th>
          </tr>
        </thead>
        <tbody>
          {ipScore.indicators.map((ind) => (
            <tr key={ind.key} className="border-b last:border-0 align-top" data-testid="indicator-row">
              <td className="py-2 pr-2">
                <div className="font-medium">{ind.label}</div>
                <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                  {ind.value}
                  {ind.source && <SourceLink source={ind.source} compact />}
                </div>
                <div
                  className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-label={`${ind.label} strength`}
                  aria-valuemin={0}
                  aria-valuemax={1}
                  aria-valuenow={ind.normalized}
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${ind.normalized * 100}%` }} />
                </div>
              </td>
              <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">{formatPercent(ind.weight)}</td>
              <td className="py-2 pl-2 text-right font-mono tabular-nums">
                {formatScore(ind.contribution)}
                <span className="text-muted-foreground">/{formatScore(ind.weight * 100)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-medium">
            <td className="py-1.5">Computed total</td>
            <td />
            <td className="py-1.5 text-right font-mono tabular-nums" data-testid="computed-total">
              {formatScore(total)}
            </td>
          </tr>
        </tfoot>
      </table>
      {mismatch && (
        <p className="text-xs text-destructive">
          Indicator points ({formatScore(total)}) don’t add up to the reported computed score (
          {formatScore(ipScore.computed)}).
        </p>
      )}
    </div>
  );
}
