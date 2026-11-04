import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import type { EntityType, SourceRef } from "@/lib/api/types";
import { ENTITY_LABEL } from "@/lib/routes";
import { EntityIcon } from "@/components/badges";
import { SourceLink } from "@/components/source-link";

export function DetailHeader({
  type,
  title,
  meta,
  badges,
  sources,
}: {
  type: EntityType;
  title: string;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
  sources?: SourceRef[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Link href="/" className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ChevronLeftIcon className="size-3" /> Search
      </Link>
      <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        <EntityIcon type={type} className="size-3.5" />
        {ENTITY_LABEL[type]}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {badges}
      </div>
      {meta && <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">{meta}</div>}
      {!!sources?.length && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {sources.map((s) => (
            <SourceLink key={s.url} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}
