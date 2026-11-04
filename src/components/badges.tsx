import { FileTextIcon, LightbulbIcon, UserIcon } from "lucide-react";
import type { EntityType, LinkEvidence, TechnologySummary } from "@/lib/api/types";
import { formatPercent, formatScore } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const ENTITY_ICON: Record<EntityType, typeof FileTextIcon> = {
  technology: LightbulbIcon,
  patent: FileTextIcon,
  inventor: UserIcon,
};

export function EntityIcon({ type, className }: { type: EntityType; className?: string }) {
  const Icon = ENTITY_ICON[type];
  return <Icon className={cn("size-4 shrink-0 text-muted-foreground", className)} aria-hidden />;
}

const STATUS_LABEL: Record<TechnologySummary["status"], string> = {
  available: "Available",
  licensed: "Licensed",
  unknown: "Status unknown",
};

export function StatusBadge({ status }: { status: TechnologySummary["status"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "available" && "border-success/40 text-success",
        status === "licensed" && "text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** Colour band for a 0–100 score. */
export function scoreTone(score: number): "high" | "mid" | "low" {
  return score >= 70 ? "high" : score >= 40 ? "mid" : "low";
}

export function ScorePill({ score, overridden, className }: { score: number; overridden?: boolean; className?: string }) {
  const tone = scoreTone(score);
  return (
    <span
      title={overridden ? "IP-potential score (analyst override)" : "IP-potential score"}
      className={cn(
        "inline-flex h-6 min-w-11 items-center justify-center gap-0.5 rounded-md px-1.5 font-mono text-xs font-semibold tabular-nums",
        tone === "high" && "bg-primary/12 text-primary",
        tone === "mid" && "bg-warning/15 text-foreground",
        tone === "low" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {formatScore(score)}
      {overridden && <span aria-label="overridden">*</span>}
    </span>
  );
}

const METHOD_LABEL: Record<LinkEvidence["method"], string> = {
  patent_number: "Patent no.",
  title_inventor: "Title + inventor",
  analyst: "Analyst confirmed",
};

export function LinkEvidenceBadge({ link }: { link: LinkEvidence }) {
  const weak = link.method === "title_inventor" && link.confidence < 0.9;
  return (
    <Badge
      variant="outline"
      title={`Linked by ${METHOD_LABEL[link.method]} with ${formatPercent(link.confidence)} confidence`}
      className={cn("font-normal", weak && "border-warning/60")}
    >
      {METHOD_LABEL[link.method]} · {formatPercent(link.confidence)}
    </Badge>
  );
}
