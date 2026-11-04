import { beforeEach, describe, expect, it } from "vitest";
import { buildAnswer } from "@/lib/mock/chat";
import * as db from "@/lib/mock/db";
import { technologies } from "@/lib/mock/fixtures";
import { sumContributions } from "@/lib/validation";

beforeEach(() => db.resetMockState());

describe("IP score (mock rubric)", () => {
  it.each(technologies.map((t) => t.id))("contributions add up to the computed score for %s", (id) => {
    const { ipScore } = db.getTechnology(id);
    expect(sumContributions(ipScore.indicators)).toBe(ipScore.computed);
    expect(ipScore.indicators.reduce((s, i) => s + i.weight, 0)).toBeCloseTo(1);
    expect(ipScore.effective).toBe(ipScore.computed);
  });
});

describe("score overrides", () => {
  it("changes the effective score and appends an audit entry", () => {
    const before = db.getTechnology("tech-b").ipScore;
    const res = db.overrideScore("tech-b", { score: 90, reason: "Strong industry interest", analyst: "Mia" });
    expect(res.ipScore.effective).toBe(90);
    expect(res.ipScore.computed).toBe(before.computed);
    expect(res.auditEntry).toMatchObject({ action: "score_override", from: String(before.effective), to: "90" });
    expect(db.getTechnology("tech-b").auditLog).toHaveLength(1);
  });

  it("requires a reason, an analyst and a 0–100 score", () => {
    expect(() => db.overrideScore("tech-b", { score: 50, reason: "", analyst: "Mia" })).toThrow(db.ValidationError);
    expect(() => db.overrideScore("tech-b", { score: 50, reason: "ok", analyst: "" })).toThrow(db.ValidationError);
    expect(() => db.overrideScore("tech-b", { score: 150, reason: "ok", analyst: "Mia" })).toThrow(db.ValidationError);
    expect(() => db.overrideScore("nope", { score: 50, reason: "ok", analyst: "Mia" })).toThrow(db.NotFoundError);
  });
});

describe("match review", () => {
  it("confirming a match links the patent to the technology", () => {
    expect(db.getTechnology("tech-f").patents).toHaveLength(0);
    const decided = db.decideMatch("match-1", { decision: "match", analyst: "Prajwal" });
    expect(decided.status).toBe("match");
    expect(db.getTechnology("tech-f").patents.map((p) => p.id)).toEqual(["US-0000008"]);
    expect(db.listMatches("pending").map((m) => m.id)).not.toContain("match-1");
    expect(() => db.decideMatch("match-1", { decision: "no_match", analyst: "Prajwal" })).toThrow(/already/);
  });

  it("rejecting does not create a link", () => {
    db.decideMatch("match-2", { decision: "no_match", analyst: "Augustin" });
    expect(db.getTechnology("tech-e").patents.map((p) => p.id)).not.toContain("US-0000003");
  });
});

describe("search", () => {
  it("ranks matching records and returns the technology shortlist for an empty query", () => {
    expect(db.search("imaging").hits[0]).toMatchObject({ type: "technology", id: "tech-a" });
    const shortlist = db.search("", "technology").hits;
    expect(shortlist).toHaveLength(technologies.length);
    const scores = shortlist.map((h) => h.ipScore ?? 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});

describe("mock chat", () => {
  it("every [n] marker in the answer has a matching citation", () => {
    const { text, citations } = buildAnswer("tell me about energy materials");
    const markers = [...text.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    expect(markers.length).toBeGreaterThan(0);
    expect(new Set(markers)).toEqual(new Set(citations.map((c) => c.n)));
  });

  it("answers without citations when nothing matches", () => {
    expect(buildAnswer("quantum blockchain zebra").citations).toEqual([]);
  });
});
