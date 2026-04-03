import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors } from "./helpers/test-utils";
import { installPortalApiMocks } from "./helpers/mock-api";

test.describe("Shared Content page", () => {
  test("renders share items with title visible", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/shared");

    await expect(page.getByText("Aria Vale").first()).toBeVisible();
    await expect(page.getByText("Aether Keep").first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("non-draft item shows Published status badge", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/shared");

    // Aria Vale has isDraft=false → QuickToggle shows "Published" when inactive
    await expect(page.getByText("Published").first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("draft item shows Draft status badge", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/shared");

    // Aether Keep has isDraft=true → QuickToggle shows "Draft" when active
    await expect(page.getByText("Aether Keep").first()).toBeVisible();
    // "Draft" text appears both in filter button and status badge
    await expect(page.getByText("Draft").first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("draft filter button hides published items and shows only drafts", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/shared");

    // The stat filter button containing "Draft" label (combined accessible name includes count + "Draft")
    await page.getByRole("button", { name: /draft/i }).first().click();

    await expect(page.getByText("Aether Keep").first()).toBeVisible();
    await expect(page.getByText("Aria Vale")).not.toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("search box filters items by title", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/shared");

    await page.getByPlaceholder(/search/i).fill("Aether");

    await expect(page.getByText("Aether Keep").first()).toBeVisible();
    await expect(page.getByText("Aria Vale")).not.toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("view button links to lore detail", async ({ page }) => {
    await installPortalApiMocks(page);
    await page.goto("/shared");

    // Each item has a "View" link pointing to /lore/{noteId}
    const viewLinks = page.getByRole("link", { name: /^view$/i });
    await expect(viewLinks.first()).toBeVisible();
    const href = await viewLinks.first().getAttribute("href");
    expect(href).toMatch(/\/lore\/note-/);
  });

  test("empty state shows message when no entries", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page, { shareTree: [] });
    await page.goto("/shared");

    await expect(page.getByText(/no lore entries found/i)).toBeVisible();

    await expectNoConsoleErrors(errors);
  });
});
