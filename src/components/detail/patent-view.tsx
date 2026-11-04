"use client";

import { useParams } from "next/navigation";
import { LandmarkIcon } from "lucide-react";
import { api } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Badge } from "@/components/ui/badge";
import { LinkEvidenceBadge, ScorePill } from "@/components/badges";
import { EntityList } from "@/components/entity-list";
import { Section } from "@/components/section";
import { ErrorState, LoadingDetail } from "@/components/states";
import { DetailHeader } from "./detail-header";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function PatentView() {
  const { id } = useParams<{ id: string }>();
  const { data: patent, error, loading, reload } = useApi(`patent:${id}`, (signal) => api.getPatent(id, signal));

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !patent) return <LoadingDetail />;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        type="patent"
        title={patent.number}
        meta={<span>{patent.title}</span>}
        sources={patent.sources}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <Section title="Abstract">
            <p className="text-sm leading-relaxed">{patent.abstract}</p>
          </Section>
          {patent.governmentInterest && (
            <Section title="Federal funding">
              <div className="flex gap-2 text-sm">
                <LandmarkIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <p className="leading-relaxed">{patent.governmentInterest}</p>
              </div>
            </Section>
          )}
          <Section title="Linked technologies" count={patent.technologies.length}>
            <EntityList
              type="technology"
              empty="Not linked to any TTO technology yet."
              items={patent.technologies.map((t) => ({
                id: t.id,
                title: t.title,
                subtitle: t.ttoCaseNumber,
                aside: (
                  <span className="flex items-center gap-2">
                    <LinkEvidenceBadge link={t.link} />
                    {t.ipScore !== undefined && <ScorePill score={t.ipScore} />}
                  </span>
                ),
              }))}
            />
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Section title="Details">
            <dl className="grid grid-cols-2 gap-3">
              <Fact label="Filed">{formatDate(patent.filedAt)}</Fact>
              <Fact label="Granted">{formatDate(patent.grantedAt)}</Fact>
              <Fact label="Forward citations">
                <span className="font-mono">{patent.forwardCitations}</span>
              </Fact>
              <Fact label="CPC">
                <span className="flex flex-wrap gap-1">
                  {patent.cpcCodes.map((c) => (
                    <Badge key={c} variant="outline" className="font-mono">
                      {c}
                    </Badge>
                  ))}
                </span>
              </Fact>
              <div className="col-span-2">
                <Fact label="Assignees">{patent.assignees.join("; ") || "—"}</Fact>
              </div>
            </dl>
          </Section>
          <Section title="Inventors" count={patent.inventors.length}>
            <EntityList
              type="inventor"
              empty="No inventors listed."
              items={patent.inventors.map((i) => ({ id: i.id, title: i.name, subtitle: i.affiliation ?? "—" }))}
            />
          </Section>
        </div>
      </div>
    </div>
  );
}
