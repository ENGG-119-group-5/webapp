/**
 * Mock implementation of the transparent IP-potential rubric (proposal §2).
 * The real backend owns this logic; it lives here only so the mock API can
 * return realistic score breakdowns.
 */
import type { IpIndicator, IpScore, ScoreOverride } from "@/lib/api/types";
import { type RawPatent, type RawTechnology, ttoSource, usptoSource } from "./fixtures";

export const RUBRIC_VERSION = "rubric-v0-sample";
/** Fixed so mock scores are deterministic. */
export const REFERENCE_YEAR = 2026;

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeIpScore(
  tech: RawTechnology,
  patents: RawPatent[],
  override: ScoreOverride | null,
): IpScore {
  const grantYears = patents
    .map((p) => (p.grantedAt ? Number(p.grantedAt.slice(0, 4)) : null))
    .filter((y): y is number => y !== null);
  const latestYear = grantYears.length ? Math.max(...grantYears) : null;
  const latestPatent = patents.find((p) => p.grantedAt?.startsWith(String(latestYear)));
  const funded = patents.find((p) => p.governmentInterest);
  const citations = patents.reduce((sum, p) => sum + p.forwardCitations, 0);
  const industry = patents.find((p) => p.assignees.some((a) => !/dartmouth/i.test(a)));

  const raw: Omit<IpIndicator, "contribution">[] = [
    {
      key: "recent_patent",
      label: "Recent patent grant",
      value: latestYear ? `Latest grant ${latestYear}` : "No granted patent",
      normalized: latestYear ? Math.max(0, 1 - (REFERENCE_YEAR - latestYear) / 10) : 0,
      weight: 0.25,
      source: latestPatent ? usptoSource(latestPatent.number) : undefined,
    },
    {
      key: "federal_funding",
      label: "Federal funding (government interest)",
      value: funded ? "Yes" : "None found",
      normalized: funded ? 1 : 0,
      weight: 0.15,
      source: funded ? usptoSource(funded.number) : undefined,
    },
    {
      key: "forward_citations",
      label: "Forward citations",
      value: `${citations} citations`,
      normalized: Math.min(1, citations / 40),
      weight: 0.25,
    },
    {
      key: "industry_coassignee",
      label: "Industry co-assignee",
      value: industry ? "Yes" : "No",
      normalized: industry ? 1 : 0,
      weight: 0.15,
      source: industry ? usptoSource(industry.number) : undefined,
    },
    {
      key: "available_for_licensing",
      label: "Listed for licensing",
      value: tech.status === "available" ? "Available" : tech.status === "licensed" ? "Already licensed" : "Unknown",
      normalized: tech.status === "available" ? 1 : tech.status === "unknown" ? 0.5 : 0,
      weight: 0.2,
      source: ttoSource(tech.ttoCaseNumber),
    },
  ];

  const indicators: IpIndicator[] = raw.map((i) => ({
    ...i,
    normalized: round1(i.normalized * 100) / 100,
    contribution: round1(i.normalized * i.weight * 100),
  }));
  const computed = round1(indicators.reduce((sum, i) => sum + i.contribution, 0));

  return {
    rubric: RUBRIC_VERSION,
    computed,
    indicators,
    override,
    effective: override?.score ?? computed,
  };
}
