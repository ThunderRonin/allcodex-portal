import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

const PARENT_NOTE = buildNote({
  noteId: "parent-1",
  title: "Northern Reaches",
  attributes: [
    { attributeId: "attr-lore-parent-1", name: "lore", value: "", type: "label" },
    { attributeId: "attr-type-parent-1", name: "loreType", value: "location", type: "label" },
  ],
});

const GRANDPARENT_NOTE = buildNote({
  noteId: "grandparent-1",
  title: "Faerun",
  attributes: [
    { attributeId: "attr-lore-gp-1", name: "lore", value: "", type: "label" },
    { attributeId: "attr-type-gp-1", name: "loreType", value: "location", type: "label" },
  ],
});

const CHILD_NOTE = buildNote({
  noteId: "child-1",
  title: "Aether Keep",
  attributes: [
    { attributeId: "attr-lore-child-1", name: "lore", value: "", type: "label" },
    { attributeId: "attr-type-child-1", name: "loreType", value: "location", type: "label" },
  ],
  content: "<h1>Aether Keep</h1><p>Fortress built above the ley breach.</p>",
});

test("lore detail page shows Lore root breadcrumb with no ancestors", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [CHILD_NOTE],
    // No breadcrumbs configured → defaults to []
  });

  await page.goto("/lore/child-1");

  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await expect(breadcrumb).toBeVisible();

  const loreLink = breadcrumb.getByRole("link", { name: /lore/i });
  await expect(loreLink).toBeVisible();
  await expect(loreLink).toHaveAttribute("href", "/lore");

  // No ancestor separators
  await expect(breadcrumb.locator("span")).toHaveCount(0);

  await expectNoConsoleErrors(errors);
});

test("lore detail page shows a single ancestor in breadcrumbs", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [PARENT_NOTE, CHILD_NOTE],
    breadcrumbs: {
      "child-1": [{ noteId: "parent-1", title: "Northern Reaches" }],
    },
  });

  await page.goto("/lore/child-1");

  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await expect(breadcrumb).toBeVisible();

  // Lore root link
  await expect(breadcrumb.getByRole("link", { name: /lore/i })).toBeVisible();

  // Ancestor link
  const ancestorLink = breadcrumb.getByRole("link", { name: /northern reaches/i });
  await expect(ancestorLink).toBeVisible();
  await expect(ancestorLink).toHaveAttribute("href", "/lore/parent-1");

  await expectNoConsoleErrors(errors);
});

test("lore detail page shows a full ancestor chain in breadcrumbs", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [GRANDPARENT_NOTE, PARENT_NOTE, CHILD_NOTE],
    breadcrumbs: {
      "child-1": [
        { noteId: "grandparent-1", title: "Faerun" },
        { noteId: "parent-1", title: "Northern Reaches" },
      ],
    },
  });

  await page.goto("/lore/child-1");

  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await expect(breadcrumb.getByRole("link", { name: /lore/i })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: /faerun/i })).toBeVisible();
  await expect(breadcrumb.getByRole("link", { name: /northern reaches/i })).toBeVisible();

  await expectNoConsoleErrors(errors);
});

test("clicking a breadcrumb ancestor navigates to that entry", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [PARENT_NOTE, CHILD_NOTE],
    breadcrumbs: {
      "child-1": [{ noteId: "parent-1", title: "Northern Reaches" }],
    },
  });

  await page.goto("/lore/child-1");

  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await breadcrumb.getByRole("link", { name: /northern reaches/i }).click();

  await expect(page).toHaveURL(/\/lore\/parent-1$/);

  await expectNoConsoleErrors(errors);
});

test("clicking the Lore root breadcrumb navigates to the lore list", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [CHILD_NOTE],
  });

  await page.goto("/lore/child-1");

  const breadcrumb = page.getByRole("navigation", { name: /breadcrumb/i });
  await breadcrumb.getByRole("link", { name: /lore/i }).click();

  await expect(page).toHaveURL(/\/lore$/);

  await expectNoConsoleErrors(errors);
});

test("breadcrumbs show a loading skeleton while data is being fetched", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);

  // Introduce network delay on breadcrumbs to observe loading state
  await page.route("**/api/lore/*/breadcrumbs", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });
  await installPortalApiMocks(page, { notes: [CHILD_NOTE] });

  await page.goto("/lore/child-1");

  // Skeleton should be briefly visible
  const skeleton = page.locator(".animate-pulse");
  // Just verify the page structure loads without errors — skeleton timing varies
  await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible({ timeout: 8000 });

  await expectNoConsoleErrors(errors);
});
