# VC Due Diligence Tool: web app

[![CI](https://github.com/ENGG-119-group-5/webapp/actions/workflows/ci.yml/badge.svg)](https://github.com/ENGG-119-group-5/webapp/actions/workflows/ci.yml)

The analyst-facing web app for **Group 5's VC Due Diligence Tool** (Carson B, Mia J, Prajwal P, Augustin G).

**MVP:** an investment team drops its **thesis PDF** onto the home page. The backend asks Claude to read it against every Dartmouth tech-transfer listing and its linked USPTO patents. Each technology comes back labelled **Strong match**, **Potential match** or **No relevance**. It is scored on area, problem, stage and deal fit, and each score shows the quote from the record it's based on. Quotes are checked against the record by code, not by the model.

Pages:

| Page | What it does |
| --- | --- |
| `/` **Match** | Upload a thesis PDF (or click a sample thesis) and see ranked matches |
| `/technology/[id]` | One technology: summary, IP-potential score breakdown, linked patents, people |
| `/search` | Keyword search over technologies, patents and inventors |

The Chat, Review, Patent and Inventor pages from the earlier design still exist but are out of the MVP and not in the navigation.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and shadcn/ui (Base UI).

## Quick start (no backend: sample data)

```bash
npm install
npm run dev          # http://localhost:3000
```

With `NEXT_PUBLIC_API_BASE_URL` unset, the app uses its **built-in mock API**, with placeholder data and a canned match result. A "Sample data" badge shows in the header.

## Run with the real backend

1. Start the [backend](https://github.com/ENGG-119-group-5/backend) and load the demo data. Follow its README: `docker compose up -d`, then `scripts/load_demo.sh`, then `uvicorn …`.
2. In this folder:
   ```bash
   echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
   npm run dev
   ```
3. Open http://localhost:3000 and click a sample thesis, or drop your own PDF.

- **Sample theses** (immune-engineering therapeutics fund, electrification materials fund) return **saved real results**: no API key and no cost.
- **Your own PDF** needs an Anthropic API key in the **backend's** `.env.local` (`ANTHROPIC_API_KEY=…`). The key never goes in this repo or in the browser.

The demo data is **real**: all 41 technologies from Dartmouth's Life Sciences and Physical Sciences licensing decks, merged with the real USPTO records for the patent numbers on those pages.

The full request and response shapes are in **[docs/API_CONTRACT.md](docs/API_CONTRACT.md)**; `src/lib/api/types.ts` is the source of truth.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm test` | Unit and component tests (Vitest + Testing Library) |
| `npm run test:e2e` | End-to-end tests (Playwright) against the mock API. Run `npx playwright install chromium` once first. |

## Project layout

```
docs/API_CONTRACT.md        Endpoint contract with the backend
src/app/
  page.tsx                  Match: thesis upload -> ranked results
  technology/[id]/          Technology detail
  search/                   Keyword search
  api/mock/**               Mock implementation of the API contract
src/components/match/       Drop zone, results list, match card
src/components/             Other UI components (ui/ = shadcn primitives)
src/lib/api/                Typed API client, contract types, NDJSON reader
src/lib/mock/               Mock data and the canned match result
tests/unit/  tests/e2e/
```

Pages fetch through `api.*` in `src/lib/api/client.ts`. Switching from the mock to the real backend changes only `NEXT_PUBLIC_API_BASE_URL`, not code. `NEXT_PUBLIC_*` values are read at build time, so restart `npm run dev` after changing `.env.local`.
