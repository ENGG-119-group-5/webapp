import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchResults } from "@/components/match/match-results";
import { api } from "@/lib/api/client";
import type { MatchResponse, TechnologyMatch } from "@/lib/api/types";

function match(id: string, label: TechnologyMatch["label"], quoteVerified = true): TechnologyMatch {
  return {
    technology: { id, title: `Tech ${id}`, ttoCaseNumber: id, status: "available", ipScore: 50 },
    category: "Life Sciences",
    label,
    totalScore: label === "strong" ? 7 : label === "potential" ? 4 : 1,
    summary: `Summary ${id}`,
    fits: [
      { key: "area", question: "Area fit?", score: 2, reason: "In scope.", quote: `quote for ${id}`, quoteVerified },
      { key: "problem", question: "Problem fit?", score: 1, reason: "Partly.", quote: "", quoteVerified: false },
      { key: "stage", question: "Stage fit?", score: 1, reason: "Early.", quote: "", quoteVerified: false },
      { key: "deal", question: "Deal fit?", score: 0, reason: "No patent.", quote: "", quoteVerified: false },
    ],
  };
}

const RESULT: MatchResponse = {
  thesisName: "thesis.pdf",
  thesisSha256: "x",
  thesisSummary: "Wants immuno-oncology therapeutics.",
  model: "claude-opus-5-5",
  source: "live",
  generatedAt: "2026-11-17T12:00:00Z",
  matches: [match("A", "strong"), match("B", "potential", false), match("C", "none")],
  unassessedIds: ["D"],
};

describe("MatchResults", () => {
  it("shows the summary, counts per label, and relevant matches in order", () => {
    render(<MatchResults result={RESULT} />);
    expect(screen.getByText("Wants immuno-oncology therapeutics.")).toBeInTheDocument();
    const counts = screen.getByTestId("match-counts");
    expect(counts).toHaveTextContent("Strong match: 1");
    expect(counts).toHaveTextContent("Potential match: 1");
    expect(counts).toHaveTextContent("No relevance: 1");

    const cards = screen.getAllByTestId("match-card");
    expect(cards.map((c) => within(c).getByRole("link").textContent)).toEqual(["Tech A", "Tech B", "Tech C"]);
    expect(within(cards[0]).getByRole("link")).toHaveAttribute("href", "/technology/A");
    expect(screen.getByText(/Not assessed by the model: D/)).toBeInTheDocument();
  });

  it("collapses no-relevance matches", () => {
    render(<MatchResults result={RESULT} />);
    const details = screen.getByText(/1 technologies with no relevance/).closest("details");
    expect(details).not.toHaveAttribute("open");
    expect(within(details!).getByText("Tech C")).toBeInTheDocument();
  });

  it("marks whether each quote was found in the record", () => {
    render(<MatchResults result={RESULT} />);
    const [a, b] = screen.getAllByTestId("match-card");
    expect(within(a).getByLabelText("Quote found in the record")).toBeInTheDocument();
    expect(within(b).getByLabelText("Quote not found in the record")).toBeInTheDocument();
  });
});

describe("api.match", () => {
  it("uploads the PDF as multipart form data", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000");
    const fetchMock = vi.fn().mockResolvedValue(Response.json(RESULT));
    vi.stubGlobal("fetch", fetchMock);
    await api.match(new Blob(["%PDF-1.4"], { type: "application/pdf" }), "thesis.pdf");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8000/match");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(Blob);
    expect(init.headers["Content-Type"]).toBeUndefined();   // browser sets the multipart boundary
  });
});
