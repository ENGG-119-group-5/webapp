"use client";

import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { ScorePill, StatusBadge } from "@/components/badges";
import { EntityList } from "@/components/entity-list";
import { Section } from "@/components/section";
import { ErrorState, LoadingDetail } from "@/components/states";
import { DetailHeader } from "./detail-header";

export function InventorView() {
  const { id } = useParams<{ id: string }>();
  const { data: inventor, error, loading, reload } = useApi(`inventor:${id}`, (signal) =>
    api.getInventor(id, signal),
  );

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !inventor) return <LoadingDetail />;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        type="inventor"
        title={inventor.name}
        meta={<span>{inventor.affiliation ?? "Affiliation unknown"}</span>}
      />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <Section title="Technologies" count={inventor.technologies.length}>
          <EntityList
            type="technology"
            empty="No linked TTO technologies."
            items={inventor.technologies.map((t) => ({
              id: t.id,
              title: t.title,
              subtitle: t.ttoCaseNumber,
              aside: (
                <span className="flex items-center gap-2">
                  <StatusBadge status={t.status} />
                  {t.ipScore !== undefined && <ScorePill score={t.ipScore} />}
                </span>
              ),
            }))}
          />
        </Section>
        <Section title="Patents" count={inventor.patents.length}>
          <EntityList
            type="patent"
            empty="No patents found."
            items={inventor.patents.map((p) => ({
              id: p.id,
              title: `${p.number} · ${p.title}`,
              subtitle: `Granted ${formatDate(p.grantedAt)}`,
            }))}
          />
        </Section>
      </div>
    </div>
  );
}
