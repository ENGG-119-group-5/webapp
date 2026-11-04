import { readNdjson } from "./stream";
import type {
  ChatEvent,
  ChatRequest,
  InventorDetail,
  MatchCandidate,
  MatchDecisionRequest,
  MatchListResponse,
  MatchStatus,
  PatentDetail,
  ScoreOverrideRequest,
  ScoreOverrideResponse,
  SearchResponse,
  SearchType,
  TechnologyDetail,
} from "./types";

/** Built-in mock API served by this Next.js app (src/app/api/mock). */
export const MOCK_API_BASE = "/api/mock";

/**
 * Base URL of the backend. Set NEXT_PUBLIC_API_BASE_URL to the FastAPI URL
 * (e.g. https://vc-tool.up.railway.app) to use the real backend; leave it
 * unset to use the built-in mock.
 */
export function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return (configured || MOCK_API_BASE).replace(/\/+$/, "");
}

export function isUsingMock(): boolean {
  return getApiBase() === MOCK_API_BASE;
}

export function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  const qs = query.toString();
  return `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}${qs ? `?${qs}` : ""}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 when the server could not be reached. */
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound() {
    return this.status === 404;
  }
}

async function send(url: string, init?: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError("Could not reach the API server.", 0);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
      else if (typeof body?.detail === "string") message = body.detail; // FastAPI default
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }
  return res;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await send(url, { signal });
  return (await res.json()) as T;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await send(url, { method: "POST", body: JSON.stringify(body) });
  return (await res.json()) as T;
}

const id = (value: string) => encodeURIComponent(value);

export const api = {
  search(
    q: string,
    type: SearchType = "all",
    limit = 25,
    signal?: AbortSignal,
  ): Promise<SearchResponse> {
    return getJson(buildUrl("/search", { q, type, limit }), signal);
  },

  getTechnology(techId: string, signal?: AbortSignal): Promise<TechnologyDetail> {
    return getJson(buildUrl(`/technology/${id(techId)}`), signal);
  },

  getPatent(patentId: string, signal?: AbortSignal): Promise<PatentDetail> {
    return getJson(buildUrl(`/patent/${id(patentId)}`), signal);
  },

  getInventor(inventorId: string, signal?: AbortSignal): Promise<InventorDetail> {
    return getJson(buildUrl(`/inventor/${id(inventorId)}`), signal);
  },

  overrideScore(
    techId: string,
    body: ScoreOverrideRequest,
  ): Promise<ScoreOverrideResponse> {
    return postJson(buildUrl(`/technology/${id(techId)}/score-override`), body);
  },

  listMatches(
    status: MatchStatus = "pending",
    signal?: AbortSignal,
  ): Promise<MatchListResponse> {
    return getJson(buildUrl("/review/matches", { status }), signal);
  },

  decideMatch(matchId: string, body: MatchDecisionRequest): Promise<MatchCandidate> {
    return postJson(buildUrl(`/review/matches/${id(matchId)}`), body);
  },

  /** Streams the answer to a chat question as ChatEvents. */
  async *chat(body: ChatRequest, signal?: AbortSignal): AsyncGenerator<ChatEvent> {
    const res = await send(buildUrl("/chat"), {
      method: "POST",
      body: JSON.stringify(body),
      headers: { Accept: "application/x-ndjson" },
      signal,
    });
    if (!res.body) throw new ApiError("Empty response from chat endpoint.", res.status);
    yield* readNdjson<ChatEvent>(res.body);
  },
};

export type Api = typeof api;
