import { test, expect } from "@playwright/test";
import { buildQuest, installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("active quests appear in the Active column", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/quests");

  await expect(page.getByText("The Lost Seal")).toBeVisible();
  await expect(page.getByText("Reclaim the Archive")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("completed quest appears in the Complete column", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/quests");

  await expect(page.getByText("The Ember Treaty")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("failed quest appears in the Failed column", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/quests");

  await expect(page.getByText("The Fallen Gate")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("quest card title links to the lore detail page", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/quests");

  const questLink = page.getByRole("link", { name: /The Lost Seal/i }).first();
  await expect(questLink).toBeVisible();
  const href = await questLink.getAttribute("href");
  expect(href).toContain("/lore/quest-1");
  await expectNoConsoleErrors(errors);
});

test("empty column shows empty state when no quests match", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    quests: [
      buildQuest({
        noteId: "quest-only-active",
        title: "Only Active Quest",
        attributes: [
          { attributeId: "attr-lore-q1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-q1", name: "loreType", value: "quest", type: "label" },
          { attributeId: "attr-status-q1", name: "questStatus", value: "active", type: "label" },
        ],
      }),
    ],
  });

  await page.goto("/quests");

  // Complete and Failed columns should show empty state messages
  await expect(page.getByText(/no complete|no completed/i)).toBeVisible();
  await expect(page.getByText(/no failed/i)).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("shows error state when quests API returns 500", async ({ page }) => {
  await installPortalApiMocks(page);
  // Override quests route to return 500
  await page.route("**/api/quests", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Internal Server Error" }) });
  });

  await page.goto("/quests");

  await expect(page.getByText(/failed to load quests/i)).toBeVisible();
});
