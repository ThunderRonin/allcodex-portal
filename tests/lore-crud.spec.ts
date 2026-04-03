import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("creates, views, and deletes a lore entry through the portal UI", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page);

  await page.goto("/lore/new");

  await page.locator("#title").fill("Vault Archivist");
  await page.getByRole("button", { name: /choose a template/i }).click();
  await page.getByRole("button", { name: /character/i }).click();
  await page.locator(".bn-editor").click();
  await page.locator(".bn-editor").pressSequentially("Keeper of the seventh seal.");
  await page.getByRole("button", { name: /create entry/i }).click();

  await expect(page).toHaveURL(/\/lore\/note-3$/);
  await expect(page.getByRole("heading", { name: "Vault Archivist" }).first()).toBeVisible();
  await expect(page.getByText("Keeper of the seventh seal.")).toBeVisible();

  await page.goto("/lore");
  await expect(page.getByRole("link", { name: /Vault Archivist/i })).toBeVisible();

  await page.goto("/lore/note-3/edit");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /delete/i }).click();

  await expect(page).toHaveURL(/\/lore$/);
  await expect(page.getByRole("link", { name: /Vault Archivist/i })).toHaveCount(0);

  expect(api.getNote("note-3")).toBeUndefined();
  await expectNoConsoleErrors(errors);
});

test("renders sanitized lore detail content without raw script tags", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Shattered Sigil",
        content: "<h1>Shattered Sigil</h1><p>Visible entry.</p><script>alert(1)</script><img src=\"x\" onerror=\"alert(2)\">",
      }),
    ],
  });

  await page.addInitScript(() => {
    (window as Window & { __alertCalls?: number }).__alertCalls = 0;
    window.alert = () => {
      (window as Window & { __alertCalls?: number }).__alertCalls = ((window as Window & { __alertCalls?: number }).__alertCalls ?? 0) + 1;
    };
  });

  await page.goto("/lore/note-1");

  const loreHtml = await page.locator(".lore-content").innerHTML();
  expect(loreHtml).not.toContain("<script");
  expect(loreHtml).not.toContain("onerror=");
  await expect(page.getByText("Visible entry.")).toBeVisible();

  const alertCalls = await page.evaluate(() => (window as Window & { __alertCalls?: number }).__alertCalls ?? 0);
  expect(alertCalls).toBe(0);

  await expectNoConsoleErrors(errors);
});

test("attaches a portrait image from the edit page and renders it on the lore detail rail", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  const api = await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Aria Vale",
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
          { attributeId: "attr-status-note-1", name: "status", value: "alive", type: "label" },
          { attributeId: "attr-rel-note-1", name: "ally", value: "note-2", type: "relation" },
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
    ],
  });

  await page.goto("/lore/note-1/edit");
  await page.getByLabel(/upload portrait image/i).setInputFiles({
    name: "aria-portrait.png",
    mimeType: "image/png",
    buffer: Buffer.from("portrait"),
  });

  await expect(page.getByText(/pending portrait relation/i)).toBeVisible();
  await page.getByRole("button", { name: /save metadata/i }).click();

  await expect(page).toHaveURL(/\/lore\/note-1$/);
  await expect(page.getByAltText(/aria vale portrait/i)).toBeVisible();
  await expect(page.getByText(/allied with/i)).toBeVisible();
  await expect(page.getByText(/Aether Keep/i).first()).toBeVisible();

  const portraitRelation = api.getNote("note-1")?.attributes.find((attribute) => attribute.name === "portraitImage");
  expect(portraitRelation?.type).toBe("relation");
  expect(portraitRelation?.value).toMatch(/^image-/);
  await expectNoConsoleErrors(errors);
});

test("selects an existing image note from portrait search and renders it on the detail rail", async ({ page }) => {
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
        content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
      }),
      buildNote({
        noteId: "image-portrait-1",
        title: "Aria Portrait",
        type: "image",
        attributes: [],
        content: "",
      }),
    ],
  });

  await page.goto("/lore/note-1/edit");
  await page.getByLabel(/find existing image note/i).fill("Aria Port");
  await page.getByRole("button", { name: /Aria Portrait/i }).click();
  await expect(page.locator("#portrait-note-id")).toHaveValue("image-portrait-1");

  await page.getByRole("button", { name: /save metadata/i }).click();
  await expect(page).toHaveURL(/\/lore\/note-1$/);
  await expect(page.getByAltText(/aria vale portrait/i)).toBeVisible();

  const portraitRelation = api.getNote("note-1")?.attributes.find((attribute) => attribute.name === "portraitImage");
  expect(portraitRelation?.value).toBe("image-portrait-1");
  await expectNoConsoleErrors(errors);
});

test("renders canonical and legacy image-note URLs through the portal image proxy", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      buildNote({
        noteId: "note-1",
        title: "Illustrated Entry",
        content: [
          "<h1>Illustrated Entry</h1>",
          '<img src="api/images/P48b58XfRf28/old-image.png" alt="canonical image">',
          '<img src="/api/lore/P48b58XfRf28/image" alt="legacy image">',
        ].join(""),
      }),
      buildNote({
        noteId: "P48b58XfRf28",
        title: "Legacy Portrait",
        type: "image",
        attributes: [],
        content: "",
      }),
    ],
  });

  await page.goto("/lore/note-1");

  const images = page.locator(".lore-content img");
  await expect(images).toHaveCount(2);
  await expect(images.nth(0)).toHaveAttribute("src", /\/api\/images\/P48b58XfRf28\//);
  await expect(images.nth(1)).toHaveAttribute("src", /\/api\/images\/P48b58XfRf28\//);
  await expectNoConsoleErrors(errors);
});