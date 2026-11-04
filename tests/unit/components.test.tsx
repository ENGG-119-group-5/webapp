import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CitationText, splitCitations } from "@/components/citation-text";
import { OverrideDialog } from "@/components/override-dialog";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { api } from "@/lib/api/client";
import type { IpScore } from "@/lib/api/types";

const ipScore: IpScore = {
  rubric: "test",
  computed: 45,
  effective: 45,
  override: null,
  indicators: [
    { key: "a", label: "Recent patent grant", value: "2024", normalized: 1, weight: 0.25, contribution: 25 },
    { key: "b", label: "Forward citations", value: "10", normalized: 0.8, weight: 0.25, contribution: 20 },
    { key: "c", label: "Listed for licensing", value: "No", normalized: 0, weight: 0.5, contribution: 0 },
  ],
};

describe("CitationText", () => {
  it("splits markers out of text", () => {
    expect(splitCitations("A [1] and B [12].")).toEqual(["A ", 1, " and B ", 12, "."]);
  });

  it("links known citations and leaves unknown markers as text", () => {
    render(
      <CitationText
        text="Tech A is promising [1], see also [2]."
        citations={[{ n: 1, type: "technology", id: "tech-a", label: "Technology A" }]}
      />,
    );
    expect(screen.getByRole("link", { name: "1" })).toHaveAttribute("href", "/technology/tech-a");
    expect(screen.queryByRole("link", { name: "2" })).toBeNull();
    expect(screen.getByText(/see also \[2\]/)).toBeInTheDocument();
  });
});

describe("ScoreBreakdown", () => {
  it("shows every indicator and a total equal to the computed score", () => {
    render(<ScoreBreakdown ipScore={ipScore} />);
    expect(screen.getAllByTestId("indicator-row")).toHaveLength(3);
    expect(screen.getByTestId("computed-total")).toHaveTextContent("45.0");
    expect(screen.queryByText(/don’t add up/)).toBeNull();
  });

  it("flags a backend total that doesn't match its indicators", () => {
    render(<ScoreBreakdown ipScore={{ ...ipScore, computed: 60, effective: 60 }} />);
    expect(screen.getByText(/don’t add up/)).toBeInTheDocument();
  });

  it("shows who overrode the score and why", () => {
    render(
      <ScoreBreakdown
        ipScore={{
          ...ipScore,
          effective: 80,
          override: { score: 80, reason: "Licensee lined up", analyst: "Carson", at: "2026-11-01T12:00:00Z" },
        }}
      />,
    );
    expect(screen.getByTestId("effective-score")).toHaveTextContent("80.0");
    expect(screen.getByTestId("override-note")).toHaveTextContent(/Carson.*80\.0.*Licensee lined up/);
  });
});

describe("OverrideDialog", () => {
  it("blocks submission until a reason and analyst are given, then calls the API", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(api, "overrideScore").mockResolvedValue({
      ipScore: { ...ipScore, effective: 70, override: { score: 70, reason: "x", analyst: "Carson", at: "" } },
      auditEntry: {
        id: "1",
        at: "",
        analyst: "Carson",
        action: "score_override",
        entity: { type: "technology", id: "tech-a", label: "A" },
        from: "45",
        to: "70",
        reason: "x",
      },
    });
    const onOverridden = vi.fn();
    render(<OverrideDialog technologyId="tech-a" technologyTitle="Technology A" ipScore={ipScore} onOverridden={onOverridden} />);

    await user.click(screen.getByRole("button", { name: /override/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /save override/i }));
    expect(within(dialog).getByText(/explain the override/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/enter your analyst name/i)).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();

    const score = within(dialog).getByLabelText(/new score/i);
    await user.clear(score);
    await user.type(score, "70");
    await user.type(within(dialog).getByLabelText(/reason/i), "Licensee already identified");
    await user.type(within(dialog).getByLabelText(/analyst/i), "Carson");
    await user.click(within(dialog).getByRole("button", { name: /save override/i }));

    expect(spy).toHaveBeenCalledWith("tech-a", { score: 70, reason: "Licensee already identified", analyst: "Carson" });
    expect(onOverridden).toHaveBeenCalled();
  });
});
