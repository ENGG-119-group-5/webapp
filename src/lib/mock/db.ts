/**
 * In-memory "database" behind the mock API. Writes (score overrides, match
 * decisions) are kept on globalThis so every route handler shares them; they
 * reset when the server restarts.
 */
import type {
  AuditEntry,
  EntityType,
  InventorDetail,
  InventorSummary,
  LinkEvidence,
  MatchCandidate,
  MatchDecisionRequest,
  MatchStatus,
  PatentDetail,
  PatentSummary,
  ScoreOverride,
  ScoreOverrideRequest,
  ScoreOverrideResponse,
  SearchHit,
  SearchResponse,
  SearchType,
  SimilarTechnology,
  TechnologyDetail,
  TechnologySummary,
} from "@/lib/api/types";
import * as fx from "./fixtures";
import { computeIpScore } from "./scoring";

interface MockState {
  overrides: Record<string, ScoreOverride>;
  audit: AuditEntry[];
  extraLinks: fx.RawLink[];
  decisions: Record<string, NonNullable<MatchCandidate["decision"]> & { status: MatchStatus }>;
  seq: number;
}

const g = globalThis as typeof globalThis & { __mockState?: MockState };

function freshState(): MockState {
  return { overrides: {}, audit: [], extraLinks: [], decisions: {}, seq: 0 };
}

export function state(): MockState {
  g.__mockState ??= freshState();
  return g.__mockState;
}

/** Test helper: reset all writes. */
export function resetMockState() {
  g.__mockState = freshState();
}

export class NotFoundError extends Error {}
export class ValidationError extends Error {}

// ------------------------------------------------------------------ lookups

const allLinks = () => [...fx.links, ...state().extraLinks];

function techOrThrow(id: string) {
  const t = fx.technologies.find((x) => x.id === id);
  if (!t) throw new NotFoundError(`Technology "${id}" not found`);
  return t;
}
function patentOrThrow(id: string) {
  const p = fx.patents.find((x) => x.id === id);
  if (!p) throw new NotFoundError(`Patent "${id}" not found`);
  return p;
}
function inventorOrThrow(id: string) {
  const i = fx.inventors.find((x) => x.id === id);
  if (!i) throw new NotFoundError(`Inventor "${id}" not found`);
  return i;
}

const patentsForTech = (techId: string) =>
  allLinks()
    .filter((l) => l.technologyId === techId)
    .map((l) => ({ patent: patentOrThrow(l.patentId), link: l.link }));

const techsForPatent = (patentId: string) =>
  allLinks()
    .filter((l) => l.patentId === patentId)
    .map((l) => ({ tech: techOrThrow(l.technologyId), link: l.link }));

function ipScoreFor(techId: string) {
  const tech = techOrThrow(techId);
  return computeIpScore(
    tech,
    patentsForTech(techId).map((x) => x.patent),
    state().overrides[techId] ?? null,
  );
}

const toTechSummary = (t: fx.RawTechnology): TechnologySummary => ({
  id: t.id,
  title: t.title,
  ttoCaseNumber: t.ttoCaseNumber,
  status: t.status,
  ipScore: ipScoreFor(t.id).effective,
});

const toPatentSummary = (p: fx.RawPatent): PatentSummary => ({
  id: p.id,
  number: p.number,
  title: p.title,
  grantedAt: p.grantedAt,
});

const toInventorSummary = (i: fx.RawInventor): InventorSummary => ({
  id: i.id,
  name: i.name,
  affiliation: i.affiliation,
});

function uniqueById<T extends { id: string }>(items: T[]): T[] {
  return [...new Map(items.map((i) => [i.id, i])).values()];
}

// ------------------------------------------------------------------ search

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function relevance(queryTokens: string[], haystack: string): number {
  if (!queryTokens.length) return 1;
  const words = tokenize(haystack);
  // A query token matches when some word in the record starts with it.
  const hits = queryTokens.filter((t) => words.some((w) => w.startsWith(t))).length;
  return hits / queryTokens.length;
}

export function search(q: string, type: SearchType = "all", limit = 25): SearchResponse {
  const tokens = tokenize(q);
  const hits: SearchHit[] = [];

  if (type === "all" || type === "technology") {
    for (const t of fx.technologies) {
      const text = [t.title, t.ttoCaseNumber, t.summary, ...t.categories].join(" ");
      hits.push({
        type: "technology",
        id: t.id,
        title: t.title,
        snippet: t.summary,
        relevance: relevance(tokens, text),
        ipScore: ipScoreFor(t.id).effective,
      });
    }
  }
  if (type === "all" || type === "patent") {
    for (const p of fx.patents) {
      const text = [p.title, p.number, p.id, p.abstract, ...p.cpcCodes].join(" ");
      hits.push({ type: "patent", id: p.id, title: p.title, snippet: p.abstract, relevance: relevance(tokens, text) });
    }
  }
  if (type === "all" || type === "inventor") {
    for (const i of fx.inventors) {
      const count = fx.patents.filter((p) => p.inventorIds.includes(i.id)).length;
      hits.push({
        type: "inventor",
        id: i.id,
        title: i.name,
        snippet: `${i.affiliation ?? "Unknown affiliation"} · ${count} patent${count === 1 ? "" : "s"}`,
        relevance: relevance(tokens, `${i.name} ${i.affiliation ?? ""}`),
      });
    }
  }

  const typeOrder: Record<EntityType, number> = { technology: 0, patent: 1, inventor: 2 };
  const ranked = hits
    .filter((h) => h.relevance > 0)
    .sort(
      (a, b) =>
        b.relevance - a.relevance ||
        typeOrder[a.type] - typeOrder[b.type] ||
        (b.ipScore ?? 0) - (a.ipScore ?? 0) ||
        a.title.localeCompare(b.title),
    );

  return { query: q, type, total: ranked.length, hits: ranked.slice(0, limit) };
}

// ------------------------------------------------------------------ details

function similarTo(techId: string): SimilarTechnology[] {
  const self = techOrThrow(techId);
  const mine = new Set(self.categories);
  return fx.technologies
    .filter((t) => t.id !== techId)
    .map((t) => {
      const shared = t.categories.filter((c) => mine.has(c)).length;
      const union = new Set([...t.categories, ...self.categories]).size;
      return { type: "technology" as const, id: t.id, label: t.title, similarity: Math.round((shared / union) * 100) / 100 };
    })
    .filter((s) => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

export function getTechnology(id: string): TechnologyDetail {
  const t = techOrThrow(id);
  const linked = patentsForTech(id);
  const inventorIds = [...new Set(linked.flatMap((x) => x.patent.inventorIds))];
  return {
    ...toTechSummary(t),
    summary: t.summary,
    categories: t.categories,
    publishedAt: t.publishedAt,
    sources: [fx.ttoSource(t.ttoCaseNumber)],
    patents: linked.map(({ patent, link }) => ({ ...toPatentSummary(patent), link })),
    inventors: inventorIds.map((i) => toInventorSummary(inventorOrThrow(i))),
    ipScore: ipScoreFor(id),
    similar: similarTo(id),
    auditLog: state()
      .audit.filter((a) => a.entity.type === "technology" && a.entity.id === id)
      .sort((a, b) => b.at.localeCompare(a.at)),
  };
}

export function getPatent(id: string): PatentDetail {
  const p = patentOrThrow(id);
  return {
    ...toPatentSummary(p),
    abstract: p.abstract,
    filedAt: p.filedAt,
    assignees: p.assignees,
    cpcCodes: p.cpcCodes,
    forwardCitations: p.forwardCitations,
    governmentInterest: p.governmentInterest,
    sources: [fx.usptoSource(p.number)],
    inventors: p.inventorIds.map((i) => toInventorSummary(inventorOrThrow(i))),
    technologies: techsForPatent(id).map(({ tech, link }) => ({ ...toTechSummary(tech), link })),
  };
}

export function getInventor(id: string): InventorDetail {
  const i = inventorOrThrow(id);
  const patents = fx.patents.filter((p) => p.inventorIds.includes(id));
  const techs = uniqueById(patents.flatMap((p) => techsForPatent(p.id).map((x) => toTechSummary(x.tech))));
  return {
    ...toInventorSummary(i),
    sources: patents.map((p) => fx.usptoSource(p.number)),
    patents: patents.map(toPatentSummary),
    technologies: techs,
  };
}

// ------------------------------------------------------------------ writes

function nextId(prefix: string) {
  state().seq += 1;
  return `${prefix}-${state().seq}`;
}

function requireAnalyst(analyst: unknown): string {
  if (typeof analyst !== "string" || !analyst.trim()) {
    throw new ValidationError("`analyst` is required");
  }
  return analyst.trim();
}

export function overrideScore(id: string, body: Partial<ScoreOverrideRequest>): ScoreOverrideResponse {
  const tech = techOrThrow(id);
  const analyst = requireAnalyst(body.analyst);
  const score = Number(body.score);
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new ValidationError("`score` must be a number between 0 and 100");
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) throw new ValidationError("`reason` is required");

  const before = ipScoreFor(id);
  const at = new Date().toISOString();
  const override: ScoreOverride = { score: Math.round(score * 10) / 10, reason, analyst, at };
  state().overrides[id] = override;

  const auditEntry: AuditEntry = {
    id: nextId("audit"),
    at,
    analyst,
    action: "score_override",
    entity: { type: "technology", id, label: tech.title },
    from: String(before.effective),
    to: String(override.score),
    reason,
  };
  state().audit.push(auditEntry);
  return { ipScore: ipScoreFor(id), auditEntry };
}

function toMatchCandidate(m: fx.RawMatchCandidate): MatchCandidate {
  const d = state().decisions[m.id];
  return {
    id: m.id,
    status: d?.status ?? "pending",
    technology: toTechSummary(techOrThrow(m.technologyId)),
    patent: toPatentSummary(patentOrThrow(m.patentId)),
    method: m.method,
    confidence: m.confidence,
    comparisons: m.comparisons,
    judgeRationale: m.judgeRationale,
    decision: d ? { analyst: d.analyst, at: d.at, note: d.note } : null,
  };
}

export function listMatches(status: MatchStatus | "all" = "pending"): MatchCandidate[] {
  return fx.matchCandidates
    .map(toMatchCandidate)
    .filter((m) => status === "all" || m.status === status)
    .sort((a, b) => b.confidence - a.confidence);
}

export function decideMatch(id: string, body: Partial<MatchDecisionRequest>): MatchCandidate {
  const m = fx.matchCandidates.find((x) => x.id === id);
  if (!m) throw new NotFoundError(`Match candidate "${id}" not found`);
  const analyst = requireAnalyst(body.analyst);
  if (body.decision !== "match" && body.decision !== "no_match") {
    throw new ValidationError("`decision` must be \"match\" or \"no_match\"");
  }
  if (state().decisions[id]) throw new ValidationError("This match has already been decided");

  const at = new Date().toISOString();
  const note = body.note?.trim() || null;
  state().decisions[id] = { status: body.decision, analyst, at, note };

  if (body.decision === "match") {
    const link: LinkEvidence = { method: "analyst", confidence: 1 };
    state().extraLinks.push({ technologyId: m.technologyId, patentId: m.patentId, link });
  }
  const tech = techOrThrow(m.technologyId);
  const patent = patentOrThrow(m.patentId);
  state().audit.push({
    id: nextId("audit"),
    at,
    analyst,
    action: "match_decision",
    entity: { type: "technology", id: tech.id, label: tech.title },
    from: "pending",
    to: `${body.decision} → ${patent.number}`,
    reason: note ?? "",
  });
  return toMatchCandidate(m);
}
