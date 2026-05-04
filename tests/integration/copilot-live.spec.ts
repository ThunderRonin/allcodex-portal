import { test, expect } from "@playwright/test";
import { requireIntegrationEnv } from "../helpers/integration-guard";

requireIntegrationEnv();

test.describe("Live Integration: Copilot", () => {
  test.setTimeout(180_000);

  test("generates and applies a real AI proposal", async ({ page }) => {
    // 1. Create a dummy note first so we have something to edit
    // (Assuming the portal has a way to create notes, or we hit ETAPI directly via test setup)
    // For simplicity, we'll use the portal's "New Entry" page.
    const uniqueId = `CopilotTest-${Date.now()}`;
    await page.goto("/lore/new");
    await page.getByPlaceholder(/e\.g\./i).fill(uniqueId);
    await page.locator(".ProseMirror").fill("Original description of a quiet village.");
    await page.getByRole("button", { name: /Create Entry/i }).click();

    // Wait for redirect to the new note
    await expect(page).toHaveURL(/\/lore\/[a-zA-Z0-9_-]+/);

    // 2. Open copilot
    await page.getByRole("button", { name: /lore copilot/i }).click();

    // 3. Ask for a change
    await page.getByPlaceholder(/Ask for article edits/i).fill("Add that the village is secretly run by a dragon.");
    await page.getByRole("button", { name: /^Send$/i }).click();

    // 4. Wait for the real AI to return a proposal
    await expect(page.getByText("Review Proposal")).toBeVisible({ timeout: 90_000 });
    
    // We expect the target to be checked
    const checkbox = page.getByRole("checkbox").first();
    await expect(checkbox).toBeChecked();

    // 5. Apply
    await page.getByRole("button", { name: "Apply Selected" }).evaluate(el => (el as HTMLElement).click());
    
    // Confirm dialog
    await page.getByRole("button", { name: /Write to Codex/i }).click();

    // 6. Verify success banner
    await expect(page.getByText("Apply completed")).toBeVisible({ timeout: 15_000 });

    // 7. Verify the content actually updated on the page
    await expect(page.locator(".wiki-article")).toContainText(/dragon/i, { timeout: 15_000 });
  });
});
