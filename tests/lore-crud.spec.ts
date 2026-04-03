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