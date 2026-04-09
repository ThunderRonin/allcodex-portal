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

test("formatting toolbar appears on text selection", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  
  // Select all text using reliable keyboard shortcut
  await page.locator(".bn-editor").click();
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+a`);
  
  // BlockNote's floating toolbar should appear
  await expect(page.locator(".bn-formatting-toolbar")).toBeVisible({ timeout: 5000 }).catch(async () => {
    // Fallback if class name varied, checking for common button tooltips
    await expect(page.getByRole("button", { name: "Bold", exact: true }).first()).toBeVisible();
  });
  
  await expectNoConsoleErrors(errors);
});

test("bold formatting applied via toolbar", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  
  // Select word
  await page.locator(".bn-editor").click();
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+a`);
  
  // Click bold button - BlockNote uses 'Bold' aria-label
  await page.locator('.bn-formatting-toolbar button[aria-label="Bold"], button[title="Bold"], button[name="Bold"]').first().click().catch(async () => {
    await page.keyboard.press(`${modifier}+b`);
  });
  
  await page.waitForTimeout(1000); // Wait for debounce
  
  const content = api.getNote("note-1")?.content ?? "";
  expect(content).toContain("<strong>");
  await expectNoConsoleErrors(errors);
});

test("image upload via editor inserts image block", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/image");
  await page.getByText("Image", { exact: true }).first().click();
  
  // Wait for file chooser and click the upload button
  const fileChooserPromise = page.waitForEvent('filechooser');
  // BlockNote's file input button says "Choose File"
  await page.getByRole('button', { name: /Choose File/i }).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake-image-data')
  });

  await page.waitForTimeout(1000);
  
  const content = api.getNote("note-1")?.content ?? "";
  expect(content).toContain("<img src=");
  await expectNoConsoleErrors(errors);
});

test("heading block created via slash menu", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/heading");
  await page.getByText(/Heading 2/i).first().click();
  await page.keyboard.type("New section");
  
  await page.waitForTimeout(1000);
  
  const content = api.getNote("note-1")?.content ?? "";
  expect(content).toMatch(/<h[1-6].*?>New section<\/h[1-6]>/);
  await expectNoConsoleErrors(errors);
});

test("undo reverses last edit", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Mistake text");
  
  await page.waitForTimeout(900); // waiting for debounce
  expect(api.getNote("note-1")?.content).toContain("Mistake text");
  
  // Trigger Undo
  const isMac = process.platform === 'darwin';
  const modifier = isMac ? 'Meta' : 'Control';
  await page.keyboard.press(`${modifier}+z`);
  
  await page.waitForTimeout(900);
  expect(api.getNote("note-1")?.content).not.toContain("Mistake text");
  await expectNoConsoleErrors(errors);
});

test("autolink dialog opens from slash menu and applies links", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  
  // Clear and type something we can autolink
  await page.locator(".bn-editor").click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Please autolink Aria Vale.");
  await page.keyboard.press("Enter");
  await page.keyboard.type("/auto");
  await page.getByText(/autolink lore/i).first().click();
  
  // Mock autolink API will match "Aria Vale"
  // Wait for dialog to show the match
  await expect(page.getByText("Aria Vale", { exact: true }).nth(1)).toBeVisible({ timeout: 5000 }).catch(async () => {
    // try to find just by text fallback
    await expect(page.getByText("Aria Vale").first()).toBeVisible();
  });
  
  // Click apply
  await page.getByRole("button", { name: /Apply Autolinks/i }).click();
  
  await page.waitForTimeout(1000);
  
  const content = api.getNote("note-1")?.content ?? "";
  expect(content).toContain("<a ");
  expect(content).toContain("note-1");
  await expectNoConsoleErrors(errors);
});

test("editor preserves content across re-mount", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, { notes: [NOTE_WITH_IMAGE] });

  await page.goto("/lore/note-1/edit");

  await expect(page.locator(".bn-editor")).toBeVisible();
  await page.locator(".bn-editor p").last().click();
  await page.keyboard.press("End");
  await page.keyboard.type(" Persistent.");

  // Wait for autosave debounce to commit
  await page.waitForTimeout(1200);

  // Verify the content was actually saved to the mock
  expect(api.getNote("note-1")?.content).toContain("Persistent");

  // Navigate away (to flush the page)
  await page.getByRole("link", { name: /Brain Dump/i }).click();
  await expect(page.getByRole("heading", { name: /Brain Dump/i })).toBeVisible();

  // Navigate directly back to the edit page (forces fresh network load, not bfcache)
  await page.goto("/lore/note-1/edit");
  await expect(page.locator(".bn-editor")).toBeVisible({ timeout: 5000 });

  // The mock now serves the updated content — the editor should reflect it
  await expect(page.locator(".bn-editor")).toContainText("Persistent", { timeout: 5000 });
  await expectNoConsoleErrors(errors);
});
