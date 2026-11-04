# VC Due Diligence Tool: web app

This is the analyst-facing web app for **Group 5's VC Due Diligence Tool** (Carson B, Mia J, Prajwal P, Augustin G). It is a first-pass screening tool for early-stage university technologies. Analysts can:

- **Search** Dartmouth TTO licensing listings, linked USPTO patents and inventors, with a shortlist ranked by IP potential.
- **Inspect** each technology: its linked patents (with how each link was made), inventors, similar technologies and source documents.
- **See why** a technology scores as it does: a transparent IP-potential breakdown of indicator, weight and points.
- **Override** a score with a required reason. Every change goes into an audit log.
- **Review** uncertain entity-resolution matches (TTO technology ↔ USPTO patent) and confirm or reject them.
- **Chat** with the orchestrator. Every statement in an answer links to the record it came from.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and shadcn/ui (Base UI). It deploys to Vercel and talks to the FastAPI backend (Railway).

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

No backend is needed. With `NEXT_PUBLIC_API_BASE_URL` unset, the app uses its **built-in mock API**, which serves placeholder sample data ("Technology A", "Inventor One", …). A **Sample data** badge in the header shows when the mock is active.

## Connecting the real backend

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL` to the FastAPI URL, e.g. `https://vc-tool.up.railway.app`.
3. Restart `npm run dev`.

The backend must implement the endpoints in **[docs/API_CONTRACT.md](docs/API_CONTRACT.md)** and allow this site's origin through CORS. The TypeScript types in `src/lib/api/types.ts` are the source of truth for every request and response shape.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit and component tests (Vitest + Testing Library) |
| `npm run test:e2e` | End-to-end tests (Playwright). Builds the app and runs it against the mock API. Run `npx playwright install chromium` once first. |

## Project layout

```
docs/API_CONTRACT.md        Endpoint contract for the backend team
src/app/                    Routes (App Router)
  page.tsx                  Search + IP-ranked shortlist
  technology/[id]/          Technology detail, score breakdown, override, audit log
  patent/[id]/  inventor/[id]/
  review/                   Match review queue
  chat/                     Streaming chat with citations
  api/mock/**               Mock implementation of the API contract
src/components/             UI components (ui/ = shadcn primitives)
src/lib/api/                Typed API client, contract types, NDJSON stream reader
src/lib/mock/               Mock data, scoring rubric, in-memory store, canned chat
tests/unit/  tests/e2e/
```

### How data flows

```
page component ──> lib/api/client.ts ──> NEXT_PUBLIC_API_BASE_URL (FastAPI)
                                    └──> /api/mock/*  (when the variable is unset)
```

Pages are client components that fetch through `api.*` (see `src/lib/use-api.ts`). Switching from the mock to the real backend changes no code, only the environment variable.

### About the mock

- Writes (score overrides, match decisions) are kept **in memory** and reset when the server restarts. On Vercel, each serverless instance has its own memory, so mock writes may not persist between requests. That's fine for demos, and the real backend persists them.
- The mock's IP-score rubric (`src/lib/mock/scoring.ts`) is only a placeholder that mirrors the proposal's indicators. The backend owns the real rubric.
- Once the backend is live, the mock can stay for demos and tests, or be deleted (`src/app/api/mock`, `src/lib/mock`).

## Deploying to Vercel

1. Import the GitHub repo in Vercel. The framework is detected as Next.js, and `vercel.json` pins it. If this app lives in a subfolder of a monorepo, set **Root Directory** to that folder.
2. Under **Settings → Environment Variables**, add `NEXT_PUBLIC_API_BASE_URL` (the Railway URL) for Production and Preview. Leave it unset to deploy the mock-backed demo.
3. Deploy, then add the Vercel domain to the backend's CORS allow-list.

`NEXT_PUBLIC_*` variables are inlined at build time, so **redeploy** after changing one.

## Analyst identity

There is no login in the MVP. The analyst types their name into the header field. It is stored in `localStorage` and sent with score overrides and match decisions, so the audit log records who did what.
