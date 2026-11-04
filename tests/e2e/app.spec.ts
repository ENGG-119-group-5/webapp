import { expect, test } from "@playwright/test";

test.describe("search", () => {
  test("shows the ranked shortlist and finds a technology", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sample-data-badge")).toBeVisible();
    await expect(page.getByText(/Shortlist · \d+ ranked by IP potential/)).toBeVisible();

    await page.getByLabel("Search query").fill("imaging");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\?q=imaging/);
    await expect(page.getByText(/results? for “imaging”/)).toBeVisible();

    await page.getByRole("tab", { name: "Patents" }).click();
    await expect(page).toHaveURL(/type=patent/);
    await expect(page.getByTestId("result-row").first()).toContainText("Patent");

    await page.getByRole("tab", { name: "All" }).click();
    await page.getByTestId("result-row").filter({ hasText: "Technology A" }).click();
    await expect(page.getByRole("heading", { name: "Technology A" })).toBeVisible();
  });

  test("shows an empty state for no matches", async ({ page }) => {
    await page.goto("/?q=zzzqqq");
    await expect(page.getByText("No results for “zzzqqq”")).toBeVisible();
  });
});

test.describe("detail pages", () => {
  test("technology → patent → inventor navigation with sources", async ({ page }) => {
    await page.goto("/technology/tech-a");
    await expect(page.getByRole("link", { name: /TTO listing TTO-0001/ }).first()).toHaveAttribute("target", "_blank");
    await page.getByRole("link", { name: /^US 0,000,001 · / }).click();
    await expect(page.getByRole("heading", { name: "US 0,000,001" })).toBeVisible();
    await expect(page.getByText(/government support/)).toBeVisible();
    await page.getByRole("link", { name: /Inventor One/ }).click();
    await expect(page.getByRole("heading", { name: "Inventor One" })).toBeVisible();
  });

  test("unknown ids show a not-found message", async ({ page }) => {
    await page.goto("/technology/does-not-exist");
    await expect(page.getByRole("alert").filter({ hasText: "Not found" })).toBeVisible();
  });
});

test("score override is applied and logged", async ({ page }) => {
  await page.goto("/technology/tech-c");
  await page.getByTestId("analyst-name").fill("E2E Analyst");
  await page.getByRole("button", { name: "Override" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/new score/i).fill("12.5");
  await dialog.getByLabel(/reason/i).fill("Inventor has left the university");
  await dialog.getByRole("button", { name: "Save override" }).click();
  await expect(dialog).toBeHidden();

  await expect(page.getByTestId("effective-score")).toHaveText("12.5");
  await expect(page.getByTestId("override-note")).toContainText("E2E Analyst");
  await expect(page.getByTestId("audit-log")).toContainText("Inventor has left the university");

  // Persisted server-side: survives a reload.
  await page.reload();
  await expect(page.getByTestId("effective-score")).toHaveText("12.5");
});

test("confirming a match links the patent", async ({ page }) => {
  await page.goto("/review");
  await page.getByTestId("analyst-name").fill("E2E Analyst");
  const card = page.getByTestId("match-card").filter({ hasText: "Technology F" });
  await card.getByRole("button", { name: "Confirm match" }).click();
  await expect(page.getByText(/Linked Technology F to US 0,000,008/)).toBeVisible();
  await expect(card).toBeHidden();

  await page.getByRole("tab", { name: "Confirmed" }).click();
  await expect(page.getByTestId("match-card").filter({ hasText: "Technology F" })).toContainText("E2E Analyst");

  await page.goto("/technology/tech-f");
  await expect(page.getByRole("link", { name: /^US 0,000,008 · / })).toBeVisible();
  await expect(page.getByText("Analyst confirmed · 100%")).toBeVisible();
});

test("chat streams an answer with working citations", async ({ page }) => {
  await page.goto("/chat");
  await page.getByLabel("Chat message").fill("Tell me about imaging");
  await page.getByRole("button", { name: "Send" }).click();

  const answer = page.getByTestId("chat-assistant").last();
  await expect(answer.getByTestId("citations")).toBeVisible({ timeout: 15_000 });
  await expect(answer).toContainText("Technology A");

  await answer.getByRole("link", { name: "1", exact: true }).click();
  await expect(page).toHaveURL(/\/technology\/tech-a$/);
});
