import { expect, test } from "@playwright/test";

test("match a sample thesis, open a technology, come back to the results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("thesis-dropzone")).toBeVisible();
  await page.getByRole("button", { name: "immune-engineering therapeutics fund" }).click();

  const results = page.getByTestId("match-results");
  await expect(results).toBeVisible();
  await expect(page.getByTestId("match-counts")).toContainText("Strong match: 1");
  const first = page.getByTestId("match-card").first();
  await expect(first).toContainText("Strong match");

  await first.getByRole("link").click();
  await expect(page).toHaveURL(/\/technology\/tech-a$/);
  await expect(page.getByRole("button", { name: "Override" })).toHaveCount(0);   // out of the MVP

  await page.getByRole("link", { name: "Matches" }).click();
  await expect(page.getByTestId("match-results")).toBeVisible();                   // results kept
});

test("uploading a non-PDF shows an error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Thesis PDF").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hi") });
  await expect(page.getByRole("alert").filter({ hasText: "Please choose a PDF file." })).toBeVisible();
});

test("uploading a PDF runs the match", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Thesis PDF").setInputFiles({
    name: "my-thesis.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  await expect(page.getByTestId("match-results")).toContainText("my-thesis.pdf");
});

test.describe("search", () => {
  test("shows the ranked shortlist and finds a technology", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByTestId("sample-data-badge")).toBeVisible();
    await expect(page.getByText(/Shortlist · \d+ ranked by IP potential/)).toBeVisible();

    await page.getByLabel("Search query").fill("imaging");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/search\?q=imaging/);
    await expect(page.getByText(/results? for “imaging”/)).toBeVisible();

    await page.getByRole("tab", { name: "Patents" }).click();
    await expect(page).toHaveURL(/type=patent/);
    await expect(page.getByTestId("result-row").first()).toContainText("Patent");

    await page.getByRole("tab", { name: "All" }).click();
    await page.getByTestId("result-row").filter({ hasText: "Technology A" }).click();
    await expect(page.getByRole("heading", { name: "Technology A" })).toBeVisible();
  });

  test("shows an empty state for no matches", async ({ page }) => {
    await page.goto("/search?q=zzzqqq");
    await expect(page.getByText("No results for “zzzqqq”")).toBeVisible();
  });
});

test.describe("detail pages", () => {
  test("technology page lists patents and inventors without linking to hidden pages", async ({ page }) => {
    await page.goto("/technology/tech-a");
    await expect(page.getByRole("link", { name: /TTO listing TTO-0001/ }).first()).toHaveAttribute("target", "_blank");
    await expect(page.getByText(/^US 0,000,001 · /)).toBeVisible();
    await expect(page.getByRole("link", { name: /^US 0,000,001 · / })).toHaveCount(0);
    await expect(page.getByText("Inventor One")).toBeVisible();
    await expect(page.getByRole("link", { name: /Inventor One/ })).toHaveCount(0);
  });

  test("unknown ids show a not-found message", async ({ page }) => {
    await page.goto("/technology/does-not-exist");
    await expect(page.getByRole("alert").filter({ hasText: "Not found" })).toBeVisible();
  });
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
  await expect(page.getByText(/^US 0,000,008 · /)).toBeVisible();
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
