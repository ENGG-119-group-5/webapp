import { describe, expect, it } from "vitest";
import { sumContributions, validateOverride } from "@/lib/validation";

describe("validateOverride", () => {
  const ok = { score: "72.5", reason: "TTO confirmed licence talks", analyst: "Carson" };

  it("accepts a valid override", () => {
    expect(validateOverride(ok)).toEqual({});
  });

  it.each([
    [{ ...ok, score: "" }, "score"],
    [{ ...ok, score: "101" }, "score"],
    [{ ...ok, score: "-1" }, "score"],
    [{ ...ok, score: "abc" }, "score"],
    [{ ...ok, reason: "   " }, "reason"],
    [{ ...ok, reason: "meh" }, "reason"],
    [{ ...ok, analyst: " " }, "analyst"],
  ])("rejects %o (%s)", (input, field) => {
    expect(validateOverride(input)).toHaveProperty(field);
  });
});

describe("sumContributions", () => {
  it("rounds to one decimal without float noise", () => {
    expect(sumContributions([{ contribution: 0.1 }, { contribution: 0.2 }])).toBe(0.3);
  });
});
