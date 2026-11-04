import type { AuditEntry } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "./states";

const ACTION_LABEL: Record<AuditEntry["action"], string> = {
  score_override: "Score override",
  match_decision: "Match decision",
};

export function AuditLog({ entries }: { entries: AuditEntry[] }) {
  if (!entries.length) {
    return <EmptyState title="No changes yet">Overrides and match decisions will appear here.</EmptyState>;
  }
  return (
    <ol className="flex flex-col gap-3 text-xs" data-testid="audit-log">
      {entries.map((e) => (
        <li key={e.id} className="border-l-2 border-primary/40 pl-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{ACTION_LABEL[e.action]}</span>
            <span className="font-mono">
              {e.from ?? "—"} → {e.to}
            </span>
          </div>
          <div className="text-muted-foreground">
            {e.analyst} · {formatDateTime(e.at)}
          </div>
          {e.reason && <p className="mt-0.5">“{e.reason}”</p>}
        </li>
      ))}
    </ol>
  );
}
