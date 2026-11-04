/**
 * API contract types — the single source of truth for what the web app expects
 * from the backend. Keep in sync with docs/API_CONTRACT.md.
 *
 * Conventions:
 *  - All timestamps are ISO-8601 strings (UTC).
 *  - All scores are on a 0–100 scale.
 *  - Every factual record carries `sources` so the UI can show where it came from.
 */

export type EntityType = "technology" | "patent" | "inventor";

/** A pointer to an original record (TTO licensing PDF, USPTO page, …). */
export interface SourceRef {
  kind: "tto" | "uspto" | "derived";
  label: string;
  url: string;
}

/** A lightweight reference to any entity, used for links and citations. */
export interface EntityRef {
  type: EntityType;
  id: string;
  label: string;
}

// ---------------------------------------------------------------- search

export type SearchType = "all" | EntityType;

export interface SearchHit {
  type: EntityType;
  id: string;
  title: string;
  snippet: string;
  /** Relevance of this hit to the query, 0–1. Hits are returned sorted by it. */
  relevance: number;
  /** Effective IP-potential score (technologies only). */
  ipScore?: number;
}

export interface SearchResponse {
  query: string;
  type: SearchType;
  total: number;
  hits: SearchHit[];
}

// ---------------------------------------------------------------- entities

export interface TechnologySummary {
  id: string;
  title: string;
  ttoCaseNumber: string;
  status: "available" | "licensed" | "unknown";
  ipScore?: number;
}

export interface PatentSummary {
  id: string;
  number: string;
  title: string;
  grantedAt: string | null;
}

export interface InventorSummary {
  id: string;
  name: string;
  affiliation: string | null;
}

/** How a technology ↔ patent link was established by entity resolution. */
export interface LinkEvidence {
  method: "patent_number" | "title_inventor" | "analyst";
  /** 0–1 */
  confidence: number;
}

export interface Technology extends TechnologySummary {
  summary: string;
  categories: string[];
  publishedAt: string | null;
  sources: SourceRef[];
}

export interface Patent extends PatentSummary {
  abstract: string;
  filedAt: string | null;
  assignees: string[];
  cpcCodes: string[];
  forwardCitations: number;
  /** Federal funding statement from the patent, if any. */
  governmentInterest: string | null;
  sources: SourceRef[];
}

export interface Inventor extends InventorSummary {
  sources: SourceRef[];
}

// ---------------------------------------------------------------- IP score

export interface IpIndicator {
  key: string;
  label: string;
  /** Human-readable raw value, e.g. "Granted 2023" or "14 citations". */
  value: string;
  /** Indicator value normalised to 0–1. */
  normalized: number;
  /** Weight in the rubric, 0–1. Weights sum to 1. */
  weight: number;
  /** normalized × weight × 100. Contributions sum to `computed`. */
  contribution: number;
  source?: SourceRef;
}

export interface ScoreOverride {
  score: number;
  reason: string;
  analyst: string;
  at: string;
}

export interface IpScore {
  /** Rubric version identifier. */
  rubric: string;
  /** Score computed from the indicators. */
  computed: number;
  indicators: IpIndicator[];
  /** Present when an analyst has overridden the computed score. */
  override: ScoreOverride | null;
  /** override?.score ?? computed — the number to display and rank by. */
  effective: number;
}

// ---------------------------------------------------------------- audit

export interface AuditEntry {
  id: string;
  at: string;
  analyst: string;
  action: "score_override" | "match_decision";
  entity: EntityRef;
  from: string | null;
  to: string;
  reason: string;
}

// ---------------------------------------------------------------- detail responses

export interface SimilarTechnology extends EntityRef {
  /** Cosine similarity, 0–1. */
  similarity: number;
}

export interface TechnologyDetail extends Omit<Technology, "ipScore"> {
  patents: (PatentSummary & { link: LinkEvidence })[];
  inventors: InventorSummary[];
  ipScore: IpScore;
  similar: SimilarTechnology[];
  auditLog: AuditEntry[];
}

export interface PatentDetail extends Patent {
  inventors: InventorSummary[];
  technologies: (TechnologySummary & { link: LinkEvidence })[];
}

export interface InventorDetail extends Inventor {
  patents: PatentSummary[];
  technologies: TechnologySummary[];
}

// ---------------------------------------------------------------- writes

export interface ScoreOverrideRequest {
  score: number;
  reason: string;
  analyst: string;
}

export interface ScoreOverrideResponse {
  ipScore: IpScore;
  auditEntry: AuditEntry;
}

// ---------------------------------------------------------------- match review

export type MatchStatus = "pending" | "match" | "no_match";

export interface MatchFieldComparison {
  field: string;
  left: string;
  right: string;
  /** 0–1 */
  similarity: number;
}

export interface MatchCandidate {
  id: string;
  status: MatchStatus;
  technology: TechnologySummary;
  patent: PatentSummary;
  method: LinkEvidence["method"];
  confidence: number;
  comparisons: MatchFieldComparison[];
  /** Rationale from the LLM judge, if one was consulted. */
  judgeRationale: string | null;
  decision: {
    analyst: string;
    at: string;
    note: string | null;
  } | null;
}

export interface MatchListResponse {
  items: MatchCandidate[];
}

export interface MatchDecisionRequest {
  decision: "match" | "no_match";
  analyst: string;
  note?: string;
}

// ---------------------------------------------------------------- chat

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export interface Citation extends EntityRef {
  /** The number used in the answer text, e.g. 1 for "[1]". */
  n: number;
  source?: SourceRef;
}

/** One line of the NDJSON stream returned by POST /chat. */
export type ChatEvent =
  | { type: "token"; text: string }
  | { type: "citation"; citation: Citation }
  | { type: "error"; message: string }
  | { type: "done" };

// ---------------------------------------------------------------- errors

/** Body of any non-2xx response. */
export interface ApiErrorBody {
  error: string;
}
