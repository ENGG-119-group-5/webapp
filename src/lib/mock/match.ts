/**
 * Canned thesis-matching result for the mock API. The real matcher (backend
 * POST /match) asks Claude; this returns a fixed answer built from the sample
 * fixtures so the UI and tests work offline.
 */
import type { FitKey, FitScore, MatchLabel, MatchResponse, SampleThesis } from "@/lib/api/types";
import { getTechnology } from "./db";

export const MOCK_SAMPLES: SampleThesis[] = [
  { name: "immune-engineering-thesis.pdf", title: "Sample: immune-engineering therapeutics fund" },
  { name: "electrification-materials-thesis.pdf", title: "Sample: electrification materials fund" },
];

/** Tiny placeholder file; the mock never reads it. */
export const MOCK_PDF = new TextEncoder().encode("%PDF-1.4\n% mock sample thesis\n%%EOF\n");

const QUESTIONS: Record<FitKey, string> = {
  area: "Area fit: is it in the sectors or therapeutic areas the thesis targets?",
  problem: "Problem fit: does it address a need or gap the thesis names?",
  stage: "Stage fit: is it mature enough for this investor's stage?",
  deal: "Deal fit: do its IP status and what the lab is looking for allow the deal the thesis wants?",
};

const PLAN: [id: string, label: MatchLabel, scores: [number, number, number, number], summary: string][] = [
  ["tech-a", "strong", [2, 2, 2, 1], "Imaging method in a target area with a granted patent."],
  ["tech-d", "potential", [2, 1, 1, 0], "Right area, but already licensed."],
  ["tech-c", "none", [0, 0, 1, 1], "Software outside the thesis sectors."],
];

export function mockMatch(thesisName: string): MatchResponse {
  const matches = PLAN.map(([id, label, scores, summary]) => {
    const t = getTechnology(id);
    const fits: FitScore[] = (Object.keys(QUESTIONS) as FitKey[]).map((key, i) => ({
      key,
      question: QUESTIONS[key],
      score: scores[i],
      reason: `Sample reason for ${key} fit.`,
      quote: i === 0 ? t.summary.split(". ")[1] ?? "" : "",
      quoteVerified: i === 0,
    }));
    return {
      technology: { id: t.id, title: t.title, ttoCaseNumber: t.ttoCaseNumber, status: t.status, ipScore: t.ipScore.effective },
      category: t.categories[0] ?? null,
      label,
      totalScore: scores.reduce((a, b) => a + b, 0),
      summary,
      fits,
    };
  });
  return {
    thesisName,
    thesisSha256: "mock",
    thesisSummary: "Sample thesis summary: the fund looks for early-stage technologies with licensable patents.",
    model: "mock",
    source: "saved_demo",
    generatedAt: "2026-11-17T00:00:00+00:00",
    matches,
    unassessedIds: ["tech-b", "tech-e", "tech-f"],
  };
}
