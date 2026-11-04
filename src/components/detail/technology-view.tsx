"use client";

import { useParams } from "next/navigation";
import { api } from "@/lib/api/client";
import { formatDate, formatPercent } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/components/audit-log";
import { LinkEvidenceBadge, ScorePill, StatusBadge } from "@/components/badges";
import { EntityList } from "@/components/entity-list";
import { OverrideDialog } from "@/components/override-dialog";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { Section } from "@/components/section";
import { ErrorState, LoadingDetail } from "@/components/states";
import { DetailHeader } from "./detail-header";

export function TechnologyView() {
  const { id } = useParams<{ id: string }>();
  const { data: tech, error, loading, reload, setData } = useApi(`technology:${id}`, (signal) =>
    api.getTechnology(id, signal),
  );

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !tech) return <LoadingDetail />;

  return (
    <div className="flex flex-col gap-6">
      <DetailHeader
        type="technology"
        title={tech.title}
        badges={
          <>
            <StatusBadge status={tech.status} />
            <ScorePill score={tech.ipScore.effective} overridden={!!tech.ipScore.override} />
          </>
        }
        meta={
          <>
            <span>TTO case {tech.ttoCaseNumber}</span>
            <span>Published {formatDate(tech.publishedAt)}</span>
          </>
        }
        sources={tech.sources}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <Section title="Summary">
            <p className="text-sm leading-relaxed">{tech.summary}</p>
            {!!tech.categories.length && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tech.categories.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </div>
            )}
          </Section>

          <Section title="Linked patents" count={tech.patents.length}>
            <EntityList
              type="patent"
              empty="No patents linked yet. Check the Review queue for candidate matches."
              items={tech.patents.map((p) => ({
                id: p.id,
                title: `${p.number} · ${p.title}`,
                subtitle: `Granted ${formatDate(p.grantedAt)}`,
                aside: <LinkEvidenceBadge link={p.link} />,
              }))}
            />
          </Section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Section title="Inventors" count={tech.inventors.length}>
              <EntityList
                type="inventor"
                empty="No inventors known (no linked patents)."
                items={tech.inventors.map((i) => ({ id: i.id, title: i.name, subtitle: i.affiliation ?? "—" }))}
              />
            </Section>
            <Section title="Similar technologies">
              <EntityList
                type="technology"
                empty="No similar technologies found."
                items={tech.similar.map((s) => ({
                  id: s.id,
                  title: s.label,
                  aside: (
                    <span className="font-mono text-xs text-muted-foreground" title="Similarity">
                      {formatPercent(s.similarity)}
                    </span>
                  ),
                }))}
              />
            </Section>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Section
            title="IP potential"
            action={
              <OverrideDialog
                technologyId={tech.id}
                technologyTitle={tech.title}
                ipScore={tech.ipScore}
                onOverridden={(res) =>
                  setData({ ...tech, ipScore: res.ipScore, auditLog: [res.auditEntry, ...tech.auditLog] })
                }
              />
            }
          >
            <ScoreBreakdown ipScore={tech.ipScore} />
          </Section>
          <Section title="Audit log" count={tech.auditLog.length}>
            <AuditLog entries={tech.auditLog} />
          </Section>
        </div>
      </div>
    </div>
  );
}
