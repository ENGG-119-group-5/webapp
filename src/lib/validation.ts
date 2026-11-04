export interface OverrideInput {
  score: string;
  reason: string;
  analyst: string;
}

export type OverrideErrors = Partial<Record<keyof OverrideInput, string>>;

/** Client-side validation for the score override form. Empty object = valid. */
export function validateOverride(input: OverrideInput): OverrideErrors {
  const errors: OverrideErrors = {};
  const trimmed = input.score.trim();
  const score = Number(trimmed);
  if (!trimmed) errors.score = "Enter a score.";
  else if (!Number.isFinite(score) || score < 0 || score > 100) errors.score = "Score must be between 0 and 100.";
  if (input.reason.trim().length < 5) errors.reason = "Explain the override (at least 5 characters).";
  if (!input.analyst.trim()) errors.analyst = "Enter your analyst name.";
  return errors;
}

/** Sum of indicator contributions, rounded like the backend (1 decimal). */
export function sumContributions(indicators: { contribution: number }[]): number {
  return Math.round(indicators.reduce((s, i) => s + i.contribution, 0) * 10) / 10;
}
