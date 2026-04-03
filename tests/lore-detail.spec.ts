import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("renders portrait in right rail when portraitImageNoteId is set", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
          { attributeId: "attr-portrait-note-1", name: "portraitImage", value: "img-1", type: "relation" },
        ],
        content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
      }),
      buildNote({ noteId: "img-1", title: "Aria Portrait" }),
    ],
  });

  await page.goto("/lore/note-1");

  await expect(page.getByAltText(/aria vale portrait/i)).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("shows placeholder portrait initials when no portrait is set", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
        ],
        content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
      }),
    ],
  });

  await page.goto("/lore/note-1");

  // Portrait placeholder slot should be visible (no real image)
  const portraitFrame = page.locator(".wiki-portrait-placeholder");
  await expect(portraitFrame).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("renders relation chips linking to the correct lore entries", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
          { attributeId: "attr-ally-note-1", name: "ally", value: "note-2", type: "relation" },
          { attributeId: "attr-enemy-note-1", name: "enemy", value: "note-3", type: "relation" },
        ],
        content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
      }),
      buildNote({
        noteId: "note-2",
        title: "Aether Keep",
        attributes: [
          { attributeId: "attr-lore-note-2", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-2", name: "loreType", value: "location", type: "label" },
        ],
      }),
      buildNote({
        noteId: "note-3",
        title: "Shadow Guild",
        attributes: [
          { attributeId: "attr-lore-note-3", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-3", name: "loreType", value: "faction", type: "label" },
        ],
      }),
    ],
  });

  await page.goto("/lore/note-1");

  await expect(page.getByRole("link", { name: /Aether Keep/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Shadow Guild/i }).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("shows GM-only warning banner when gmOnly attribute is present", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Secret Vault",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "location", type: "label" },
          { attributeId: "attr-gm-note-1", name: "gmOnly", value: "", type: "label" },
        ],
        content: "<h1>Secret Vault</h1><p>Hidden beneath the citadel.</p>",
      }),
    ],
  });

  await page.goto("/lore/note-1");

  const banner = page.locator(".wiki-warning-banner");
  await expect(banner).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("ShareSettings draft toggle fires attribute mutation", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
          { attributeId: "attr-draft-note-1", name: "draft", value: "", type: "label" },
        ],
        content: "<h1>Aria Vale</h1>",
      }),
    ],
  });

  await page.goto("/lore/note-1");

  // Expect "Draft" badge to be visible in the ShareSettings rail
  await expect(page.getByRole("button", { name: "Draft" }).first()).toBeVisible();

  // Click to toggle to Published (removes draft attribute)
  await page.getByRole("button", { name: "Draft" }).first().click();

  // After toggling, the badge should change to Published
  await expect(page.getByRole("button", { name: "Published" }).first()).toBeVisible();

  await expectNoConsoleErrors(errors);
});

test("View AI Suggestions button navigates to relationships page with noteId param", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
        ],
        content: "<h1>Aria Vale</h1>",
      }),
    ],
  });

  await page.goto("/lore/note-1");

  await page.getByRole("link", { name: /view ai suggestions/i }).click();

  await expect(page).toHaveURL(/\/ai\/relationships\?noteId=note-1/);
  await expectNoConsoleErrors(errors);
});

test("renders lore metadata labels in the Details card", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
          { attributeId: "attr-status-note-1", name: "status", value: "alive", type: "label" },
          { attributeId: "attr-rank-note-1", name: "rank", value: "Warden", type: "label" },
        ],
        content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
      }),
    ],
  });

  await page.goto("/lore/note-1");

  await expect(page.getByText("alive").first()).toBeVisible();
  await expect(page.getByText("Warden").first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});
