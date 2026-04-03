import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors } from "./helpers/test-utils";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";

test.describe("Dashboard page", () => {
  test("shows Chronicle Overview heading and stat card labels", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Chronicle Overview" })).toBeVisible();
    await expect(page.getByText("Total Lore Entries")).toBeVisible();
    await expect(page.getByText("Updated This Week")).toBeVisible();
    await expect(page.getByText("RAG Indexed")).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("recent entries list shows default notes", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/");

    // Default seed notes appear as links in the Recent Entries list
    await expect(page.getByRole("link", { name: "Aria Vale" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Aether Keep" }).first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("New Lore Entry button links to /lore/new", async ({ page }) => {
    await installPortalApiMocks(page);
    await page.goto("/");

    const newEntryLink = page.getByRole("link", { name: /new lore entry/i });
    await expect(newEntryLink).toBeVisible();
    await expect(newEntryLink).toHaveAttribute("href", "/lore/new");
  });

  test("Quick Actions panel shows Brain Dump, Consistency Check, and Gap Detector links", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/");

    await expect(page.getByRole("link", { name: "Brain Dump" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Consistency Check" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Gap Detector" }).first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("view all entries link appears when more than 8 entries exist", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    // 9 notes → totalCount > 8 → "View all 9 entries →" link appears
    // Don't override attributes so buildNote includes the required `lore` label
    const manyNotes = Array.from({ length: 9 }, (_, i) =>
      buildNote({
        noteId: `note-${i + 1}`,
        title: `Lore Entry ${i + 1}`,
      }),
    );

    await installPortalApiMocks(page, { notes: manyNotes });
    await page.goto("/");

    await expect(page.getByRole("link", { name: /view all/i })).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("empty state shows No lore entries yet message and Open Brain Dump link", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page, { notes: [] });
    await page.goto("/");

    await expect(page.getByText(/no lore entries yet/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /open brain dump/i })).toBeVisible();

    await expectNoConsoleErrors(errors);
  });
});
