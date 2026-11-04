# API contract: web app ↔ backend

This document lists every HTTP endpoint the web app calls and the exact JSON it expects back. The FastAPI backend should implement these endpoints. Until it does, the web app serves the same contract from a built-in mock (`src/app/api/mock/**`).

- **Source of truth for types:** [`src/lib/api/types.ts`](../src/lib/api/types.ts). If this document and that file disagree, the file wins. Please update both together.
- **Reference implementation:** [`src/lib/mock/db.ts`](../src/lib/mock/db.ts) shows the expected behaviour of each endpoint (ranking, validation, side effects).

## General rules

| Rule | Detail |
|---|---|
| Base URL | The web app reads `NEXT_PUBLIC_API_BASE_URL`, e.g. `https://vc-tool.up.railway.app`. Paths below are relative to it, with no `/api` prefix. |
| Format | JSON in, JSON out (`Content-Type: application/json`), except `POST /chat`, which streams NDJSON. |
| Field names | **camelCase**. In FastAPI/Pydantic use `alias_generator=to_camel` with `populate_by_name=True`, and return with `by_alias=True`. |
| Dates | ISO-8601 strings. Date-only fields (`grantedAt`, `filedAt`, `publishedAt`) use `YYYY-MM-DD`. Timestamps (`at`) use full UTC datetimes. Unknown values are `null`. |
| Scores | Always on a 0–100 scale, rounded to 1 decimal. Confidence and similarity values are 0–1. |
| Errors | Any non-2xx status. The body is `{"error": "message"}`, but FastAPI's default `{"detail": "message"}` also works. Use **404** for unknown ids and **422** for invalid input. The message is shown to the analyst. |
| CORS | The browser calls the backend directly, so FastAPI must allow the Vercel origin (and `http://localhost:3000` for local dev) through `CORSMiddleware`. |
| Traceability | Every record carries `sources: SourceRef[]` linking to the original TTO PDF or USPTO page. Analysts can open them. |

### Shared shapes

```ts
type EntityType = "technology" | "patent" | "inventor";
interface SourceRef { kind: "tto" | "uspto" | "derived"; label: string; url: string }
interface EntityRef { type: EntityType; id: string; label: string }
interface TechnologySummary { id: string; title: string; ttoCaseNumber: string; status: "available" | "licensed" | "unknown"; ipScore?: number }
interface PatentSummary { id: string; number: string; title: string; grantedAt: string | null }
interface InventorSummary { id: string; name: string; affiliation: string | null }
interface LinkEvidence { method: "patent_number" | "title_inventor" | "analyst"; confidence: number }
```

`LinkEvidence` records how entity resolution connected a technology to a patent: by patent number first, then by title and inventor names, or by an analyst confirming the link in the review queue.

---

## `GET /search`

Ranked search across technologies, patents and inventors.

| Query param | Type | Default | Notes |
|---|---|---|---|
| `q` | string | `""` | An empty query returns everything of the requested type. The web app uses `q=""&type=technology` as the **shortlist**, so return it sorted by `ipScore` descending. |
| `type` | `all` \| `technology` \| `patent` \| `inventor` | `all` | |
| `limit` | int 1–100 | 25 | |

**200**

```json
{
  "query": "imaging",
  "type": "all",
  "total": 3,
  "hits": [
    {
      "type": "technology",
      "id": "tech-a",
      "title": "Technology A",
      "snippet": "An imaging method for medical devices…",
      "relevance": 1.0,
      "ipScore": 81.9
    },
    {
      "type": "patent",
      "id": "US-0000001",
      "title": "Imaging contrast method",
      "snippet": "A method of improving imaging contrast…",
      "relevance": 1.0
    }
  ]
}
```

- `hits` are sorted best first. `relevance` is 0–1.
- `ipScore` is the **effective** score and is only present on technology hits.

## `GET /technology/{id}`

**200**: `TechnologyDetail`

```json
{
  "id": "tech-a",
  "title": "Technology A",
  "ttoCaseNumber": "TTO-0001",
  "status": "available",
  "summary": "An imaging method for medical devices…",
  "categories": ["Medical devices", "Imaging"],
  "publishedAt": "2024-03-01",
  "sources": [{ "kind": "tto", "label": "TTO listing TTO-0001", "url": "https://…/TTO-0001.pdf" }],
  "patents": [
    {
      "id": "US-0000001",
      "number": "US 0,000,001",
      "title": "Imaging contrast method",
      "grantedAt": "2023-05-16",
      "link": { "method": "patent_number", "confidence": 1.0 }
    }
  ],
  "inventors": [{ "id": "inv-1", "name": "Inventor One", "affiliation": "Dartmouth College" }],
  "ipScore": {
    "rubric": "rubric-v0",
    "computed": 81.9,
    "indicators": [
      {
        "key": "recent_patent",
        "label": "Recent patent grant",
        "value": "Latest grant 2024",
        "normalized": 0.8,
        "weight": 0.25,
        "contribution": 20.0,
        "source": { "kind": "uspto", "label": "USPTO record US 0,000,002", "url": "https://…" }
      }
    ],
    "override": null,
    "effective": 81.9
  },
  "similar": [{ "type": "technology", "id": "tech-d", "label": "Technology D", "similarity": 0.33 }],
  "auditLog": []
}
```

**IP-score rules.** The web app checks these and shows a warning if they don't hold:

- `contribution = normalized × weight × 100`, rounded to 1 decimal.
- The `weight`s sum to 1.
- `computed` = the sum of the `contribution`s.
- `effective` = `override.score` if an override exists, otherwise `computed`.
- `override` is `{ score, reason, analyst, at }` or `null`.
- `auditLog` is newest first, using the `AuditEntry` shape below.

**404** if the id is unknown.

## `GET /patent/{id}`

**200**: `PatentDetail`

```json
{
  "id": "US-0000001",
  "number": "US 0,000,001",
  "title": "Imaging contrast method",
  "grantedAt": "2023-05-16",
  "filedAt": "2020-02-11",
  "abstract": "…",
  "assignees": ["Trustees of Dartmouth College"],
  "cpcCodes": ["A61B 6/00"],
  "forwardCitations": 14,
  "governmentInterest": "This invention was made with government support under grant … awarded by the NIH…",
  "sources": [{ "kind": "uspto", "label": "USPTO record US 0,000,001", "url": "https://…" }],
  "inventors": [{ "id": "inv-1", "name": "Inventor One", "affiliation": "Dartmouth College" }],
  "technologies": [
    {
      "id": "tech-a",
      "title": "Technology A",
      "ttoCaseNumber": "TTO-0001",
      "status": "available",
      "ipScore": 81.9,
      "link": { "method": "patent_number", "confidence": 1.0 }
    }
  ]
}
```

`governmentInterest` holds the patent's federal-funding statement, or `null` if there is none.

## `GET /inventor/{id}`

**200**: `InventorDetail`

```json
{
  "id": "inv-1",
  "name": "Inventor One",
  "affiliation": "Dartmouth College",
  "sources": [{ "kind": "uspto", "label": "USPTO record US 0,000,001", "url": "https://…" }],
  "patents": [{ "id": "US-0000001", "number": "US 0,000,001", "title": "…", "grantedAt": "2023-05-16" }],
  "technologies": [{ "id": "tech-a", "title": "Technology A", "ttoCaseNumber": "TTO-0001", "status": "available", "ipScore": 81.9 }]
}
```

## `POST /technology/{id}/score-override`

An analyst replaces the computed score. The backend should persist the override and log it.

**Request**

```json
{ "score": 72.5, "reason": "TTO says a licence is already under negotiation", "analyst": "Carson" }
```

**200**

```json
{
  "ipScore": { "…": "the updated IpScore, with override set and effective = 72.5" },
  "auditEntry": {
    "id": "audit-17",
    "at": "2026-11-04T14:31:00Z",
    "analyst": "Carson",
    "action": "score_override",
    "entity": { "type": "technology", "id": "tech-a", "label": "Technology A" },
    "from": "81.9",
    "to": "72.5",
    "reason": "TTO says a licence is already under negotiation"
  }
}
```

**422** if `score` is outside 0–100, or if `reason` or `analyst` is missing or blank. **404** if the id is unknown.

## `GET /review/matches`

Entity-resolution candidates that need a human decision: uncertain matches from the cascade or the LLM judge.

| Query param | Values | Default |
|---|---|---|
| `status` | `pending` \| `match` \| `no_match` \| `all` | `pending` |

**200**

```json
{
  "items": [
    {
      "id": "match-1",
      "status": "pending",
      "technology": { "id": "tech-f", "title": "Technology F", "ttoCaseNumber": "TTO-0006", "status": "unknown", "ipScore": 10 },
      "patent": { "id": "US-0000008", "number": "US 0,000,008", "title": "…", "grantedAt": "2025-07-08" },
      "method": "title_inventor",
      "confidence": 0.62,
      "comparisons": [
        { "field": "Title", "left": "TTO title…", "right": "USPTO title…", "similarity": 0.71 },
        { "field": "Inventors", "left": "Inventor Six", "right": "Inventor Six", "similarity": 1.0 }
      ],
      "judgeRationale": "Titles describe the same function and the inventor matches, but…",
      "decision": null
    }
  ]
}
```

- `left` holds the TTO-side value and `right` the USPTO-side value.
- `judgeRationale` is `null` when the LLM judge wasn't consulted.
- Sort items by `confidence`, highest first.

## `POST /review/matches/{id}`

**Request**

```json
{ "decision": "match", "analyst": "Prajwal", "note": "Same inventor, PDF just omits the number" }
```

`decision` is `"match"` or `"no_match"`, and `note` is optional.

**200**: the updated `MatchCandidate`, with `status` and `decision: { analyst, at, note }` filled in.

Side effects the web app relies on:

- `match` creates the technology ↔ patent link with `link: { method: "analyst", confidence: 1 }`, so it appears on both detail pages.
- Both decisions append an `AuditEntry` with `action: "match_decision"` to the technology's audit log.

**422** if the match was already decided or the body is invalid. **404** if the id is unknown.

## `POST /chat`

The question goes to the orchestrator: graph search, IP potential, similarity, and RAG summary.

**Request**

```json
{
  "message": "Which imaging technologies are available?",
  "history": [
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ]
}
```

**200**: `Content-Type: application/x-ndjson`, one JSON object per line, streamed as they are produced:

```
{"type":"citation","citation":{"n":1,"type":"technology","id":"tech-a","label":"Technology A","source":{"kind":"tto","label":"…","url":"…"}}}
{"type":"token","text":"Technology A "}
{"type":"token","text":"is available for licensing [1]."}
{"type":"done"}
```

| Event | Meaning |
|---|---|
| `token` | The next piece of answer text. The client concatenates `text` exactly as sent, so include spaces. |
| `citation` | A record the answer cites. `n` matches the `[n]` markers in the text. It may arrive before or during the tokens. |
| `error` | `{"type":"error","message":"…"}`. Shown to the analyst. The stream can then end. |
| `done` | The answer is complete. |

**Citation rule** (proposal §2, "every sentence of a brief must cite a retrieved record"):

- Every `[n]` in the text must have a matching `citation` event.
- The UI links each `[n]` to `/technology|patent|inventor/{id}`.
- Markers without a citation are shown as plain text and are never linked.

FastAPI sketch:

```python
from fastapi.responses import StreamingResponse

@app.post("/chat")
async def chat(req: ChatRequest):
    async def events():
        async for ev in orchestrator.answer(req.message, req.history):
            yield json.dumps(ev) + "\n"
    return StreamingResponse(events(), media_type="application/x-ndjson")
```

---

## Shared types referenced above

```ts
interface AuditEntry {
  id: string; at: string; analyst: string;
  action: "score_override" | "match_decision";
  entity: EntityRef;
  from: string | null; to: string; reason: string;
}

interface IpIndicator {
  key: string; label: string; value: string;
  normalized: number;   // 0–1
  weight: number;       // 0–1, weights sum to 1
  contribution: number; // normalized × weight × 100
  source?: SourceRef;
}
```
