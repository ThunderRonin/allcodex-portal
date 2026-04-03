import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

const NOTE_WITH_IMAGE = buildNote({
  noteId: "note-1",
  title: "Aria Vale",
  attributes: [
    { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
    { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
  ],
  content: '<h1>Aria Vale</h1><img src="/api/lore/img-1/image" alt="banner"><p>Warden of the northern archive.</p>',
});

test("slash menu opens and shows more than one item after an image block", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  // Wait for editor
  await expect(page.locator(".bn-editor")).toBeVisible();
  // Click at end of content and type /
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  // Press Enter to create a new block after image if needed
  await page.keyboard.press("Enter");
  await page.keyboard.type("/");

  // BlockNote renders slash menu items as role=option inside role=listbox
  const menuOptions = page.getByRole("option");
  await expect(menuOptions.first()).toBeVisible({ timeout: 5000 });
  const count = await menuOptions.count();
  expect(count).toBeGreaterThan(1);

  await expectNoConsoleErrors(errors);
});

test("Autolink Lore custom slash menu item is visible", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/auto");

  await expect(page.getByText(/autolink lore/i)).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("@ mention shows suggestion dropdown", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("@Ae");

  await expect(page.getByText("Aether Keep")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("editor content saves via PUT after typing", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
        ],
        content: "<h1>Aria Vale</h1><p>Original body.</p>",
      }),
    ],
  });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Updated text.");

  // Wait for autosave debounce (750ms) + buffer
  await page.waitForTimeout(1200);

  const content = api.getNote("note-1")?.content ?? "";
  expect(content).toContain("Updated text");
  await expectNoConsoleErrors(errors);
});

test("title edit saves via PATCH on Save click", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Old Title",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
        ],
      }),
    ],
  });

  await page.goto("/lore/note-1/edit");

  const titleInput = page.locator("#title");
  await titleInput.clear();
  await titleInput.fill("New Title");
  await page.getByRole("button", { name: /save metadata/i }).click();

  await expect(page).toHaveURL(/\/lore\/note-1$/);
  expect(api.getNote("note-1")?.title).toBe("New Title");
  await expectNoConsoleErrors(errors);
});

test("portrait clear button removes the portrait relation on save", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
          { attributeId: "attr-portrait-note-1", name: "portraitImage", value: "img-1", type: "relation" },
        ],
      }),
      buildNote({ noteId: "img-1", title: "Aria Portrait" }),
    ],
  });

  await page.goto("/lore/note-1/edit");

  // The portrait note ID input should show the current portrait
  await expect(page.locator("#portrait-note-id")).toHaveValue("img-1");

  // Click clear button
  await page.getByRole("button", { name: /clear portrait/i }).click();

  await expect(page.locator("#portrait-note-id")).toHaveValue("");

  await page.getByRole("button", { name: /save metadata/i }).click();
  await expect(page).toHaveURL(/\/lore\/note-1$/);

  const portraitAttr = api.getNote("note-1")?.attributes.find((a) => a.name === "portraitImage");
  expect(portraitAttr).toBeUndefined();
  await expectNoConsoleErrors(errors);
});
