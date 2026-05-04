import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";

test.describe("Relationship Graph", () => {
  test("displays relationships, AI suggestions, and allows applying them", async ({ page }) => {
    await installPortalApiMocks(page, {
      notes: [
        buildNote({ noteId: "note-1", title: "Aria Vale" }),
      ],
    });

    await page.route("**/api/lore/note-1/relationships", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          existing: [
            { name: "ally", targetNoteId: "note-2", targetTitle: "Bob" },
          ],
          suggestions: [
            {
              targetNoteId: "note-3",
              targetTitle: "Charlie",
              relationshipType: "enemy",
              description: "Sworn enemies.",
            },
          ],
        }),
      });
    });

    let appliedRelation = false;
    await page.route("**/api/ai/relationships", async (route) => {
      if (route.request().method() === "PUT") {
        appliedRelation = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true, applied: 1 }),
        });
        return;
      }
      await route.fallback();
    });

    await page.goto("/lore/note-1");

    // Click the Relationship Map header to expand it
    const mapHeader = page.getByRole("button", { name: /Relationship Map/i });
    await mapHeader.click();

    // Verify it loads and renders the suggestions
    await expect(page.getByText("Bob")).toBeVisible();
    await expect(page.getByText("Charlie").first()).toBeVisible();
    await expect(page.getByText("Sworn enemies.")).toBeVisible();

    // Click Apply on the AI suggestion
    await page.getByRole("button", { name: "Apply" }).click();

    // Verify it changes to Applied
    await expect(page.getByRole("button", { name: "Applied" })).toBeVisible();
    expect(appliedRelation).toBe(true);
  });

  test("handles fetch errors gracefully", async ({ page }) => {
    await installPortalApiMocks(page, {
      notes: [buildNote({ noteId: "note-1", title: "Aria Vale" })],
    });

    await page.route("**/api/lore/note-1/relationships", async (route) => {
      await route.fulfill({ status: 500, body: "Error" });
    });

    await page.goto("/lore/note-1");

    await page.getByRole("button", { name: /Relationship Map/i }).click();

    await expect(page.getByText(/Failed to load relationships/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
  });
});
