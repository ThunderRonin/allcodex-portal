import { test, expect } from "@playwright/test";
import { requireIntegrationEnv } from "../helpers/integration-guard";

// Skip if we don't have real credentials
requireIntegrationEnv();

test.describe("Live Integration: Brain Dump", () => {
  // Integration tests hit real LLMs, give them time
  test.setTimeout(240_000);

  test("processes a real brain dump and creates a note", async ({ page }) => {
    // Generate a unique ID for this test run so we can find it
    const uniqueId = `integration-test-${Date.now()}`;
    const testText =
      `${uniqueId} is a previously undocumented underwater fortress embedded deep within the Sapphire Reef. ` +
      `No record of ${uniqueId} exists in the chronicle; it must be filed as an entirely new location.`;

    await page.goto("/brain-dump");

    const textarea = page.getByPlaceholder(/write anything/i);
    await textarea.fill(testText);

    // Submit
    await page.getByRole("button", { name: /process with allknower/i }).click();

    // Wait for the pipeline to finish — first the button exits its processing state,
    // then the completion banner appears.
    await expect(page.getByRole("button", { name: /processing…/i })).toHaveCount(0, { timeout: 120_000 });
    await expect(page.getByText(/Processing Complete/i)).toBeVisible({ timeout: 15_000 });

    // The completed run should expose a lore entry link for the unique location.
    const noteLink = page
      .locator("a[href*='/lore/']")
      .filter({ hasText: uniqueId })
      .first();
    await expect(noteLink).toBeVisible({ timeout: 15_000 });
    await noteLink.click();

    // Verify we landed on the note page and the text is incorporated
    await expect(page.getByRole("heading", { name: uniqueId })).toBeVisible();
    await expect(page.locator(".wiki-article")).toContainText(uniqueId);
  });
});
