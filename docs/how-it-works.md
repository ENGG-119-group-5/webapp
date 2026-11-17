# How the web app works (plain-language guide)

This page explains what the website does and how its code is organised, in everyday words. You don't need to know how to code to follow it. For setup commands, see the [README](../README.md). For the exact data formats, see [API_CONTRACT.md](API_CONTRACT.md).

## What it is for

The web app is the part people see and click. A venture capital (VC) analyst uses it to:

1. **Match a thesis.** Upload their investment thesis (a PDF saying what they want to fund) and see every Dartmouth invention ranked by how well it fits.
2. **Look closer.** Open any invention to see its patents, its inventors and its IP score, with the reasons behind the score.
3. **Search.** Find inventions, patents or inventors by keyword.

The website **doesn't do the heavy work itself**. The [backend](https://github.com/ENGG-119-group-5/backend) does: it holds the database and asks Claude (the AI model) to read the thesis. The website sends requests to the backend and displays the answers clearly.

```text
  Your browser  ──►  Web app (this repo, port 3000)  ──►  Backend API (port 8000)  ──►  Database + Claude
                ◄──  pages, cards, tables            ◄──  answers as JSON          ◄──
```

## The pages

| Page | Address | What you see | Main code |
| --- | --- | --- | --- |
| **Match** (home) | `/` | A drop zone for your thesis PDF and buttons for two sample theses. After matching: a summary of what the thesis wants, counts per label, then one card per invention, best first. | `src/components/match/` |
| **Technology** | `/technology/2021-023` | One invention: summary, IP score breakdown, linked patents (with how sure we are of each link), the people behind it, and links to the original sources. | `src/components/detail/technology-view.tsx` |
| **Search** | `/search` | A search box with tabs for All, Technologies, Patents and Inventors. | `src/components/search/` |

The Chat, Review, Patent and Inventor pages come from the earlier design. They still exist in the code but are not in the menu, because they are outside the MVP.

## How a thesis match works, step by step

1. **You drop a PDF** on the home page (`thesis-dropzone.tsx`). Anything that isn't a PDF is refused immediately.
2. **The page sends it to the backend** (`match-view.tsx` calls `api.match(...)`) and shows a spinner. A new thesis takes 1–3 minutes, because Claude reads every invention. A sample thesis comes back instantly, because its answer was saved earlier.
3. **The results appear** (`match-results.tsx`):
   - A short summary of what the thesis looks for.
   - How many inventions are **Strong match**, **Potential match** and **No relevance**.
   - One **card** per invention (`match-card.tsx`). Each card has the label, a total out of 8, the IP score, and four boxes: **area**, **problem**, **stage** and **deal** fit. Each box shows 0–2 dots, Claude's reason, and the quote Claude gave as proof.
4. **The quote check.** A green tick next to a quote means the backend found those exact words in the invention's record. An orange warning means it didn't, so that reason deserves a second look.
5. **Click an invention's name** to open its Technology page. When you come back, your results are still there.

## The IP score on the Technology page

The big number (0–100) is a quick measure of **how strong the invention's patent position is**. It is calculated by simple rules, not by AI. The table under it (`score-breakdown.tsx`) lists the six checks that make up the score: patent protection, link confidence, number of linked patents, federal funding, recent activity and availability. For each check it shows what was found, what the check can be worth, and the points it earned. The points add up to the total. See the backend's guide for the rules.

## Real data vs. sample data

The app can run in two modes, controlled by one setting, `NEXT_PUBLIC_API_BASE_URL`, in the `.env.local` file:

- **Connected to the backend** (the setting points to `http://localhost:8000`, which the launcher does for you): real Dartmouth data and real Claude results.
- **On its own** (the setting is empty): the app answers itself with **made-up placeholder data**, such as "Technology A". A **"Sample data"** badge appears in the header so nobody mistakes it for real results. This mode lets you work on the design and run the tests without the backend.

The placeholder backend lives in `src/lib/mock/` (data and logic) and `src/app/api/mock/` (the web addresses).

## How the code is organised

| Folder / file | What it does |
| --- | --- |
| `src/app/` | One folder per page. The address in the browser matches the folder name: `src/app/search/page.tsx` is `/search`. `layout.tsx` is the frame around every page. |
| `src/components/` | The building blocks the pages are made of: cards, tables, badges, the header, loading spinners and error messages. |
| `src/components/ui/` | Generic buttons, inputs, dialogs and so on, from the shadcn/ui library. |
| `src/lib/api/client.ts` | **The one place that talks to the backend.** Every page asks for data through it. |
| `src/lib/api/types.ts` | **The agreed shape of every answer from the backend.** The backend has a matching list in `src/api/models.py`. Change both together. |
| `src/lib/use-api.ts` | A helper that loads data for a page and tracks "loading", "error" or "done". |
| `src/lib/mock/` | The placeholder backend used when the real one isn't connected. |
| `tests/` | Automated checks: unit tests (Vitest) and click-through browser tests (Playwright). They also run on GitHub for every change. |

## Tools it is built with

- **Next.js** and **React** for the pages
- **TypeScript**: JavaScript that checks data types, which catches mistakes early
- **Tailwind CSS** for styling
- **shadcn/ui** for ready-made buttons, dialogs and inputs
