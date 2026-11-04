import { ExternalLinkIcon } from "lucide-react";
import type { SourceRef } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export function SourceLink({ source, compact, className }: { source: SourceRef; compact?: boolean; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={source.label}
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline",
        className,
      )}
    >
      <ExternalLinkIcon className="size-3 shrink-0" aria-hidden />
      {compact ? <span className="sr-only">{source.label}</span> : source.label}
    </a>
  );
}
