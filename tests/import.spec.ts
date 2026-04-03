import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

// ── System Pack ───────────────────────────────────────────────────────────────

test("system pack: uploading valid JSON shows a preview list", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/import");

  const systemPackTab = page.getByRole("tab", { name: /system pack/i });
  if (await systemPackTab.isVisible()) {
    await systemPackTab.click();
  }

  const json = JSON.stringify([
    { name: "Goblin", cr: "1/4", type: "humanoid", ac: "15", hp: "7" },
    { name: "Orc", cr: "1/2", type: "humanoid", ac: "13", hp: "15" },
  ]);

  await page.locator("input[type='file']").first().setInputFiles({
    name: "statblocks.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });

  // Wait for preview header
  await expect(page.getByText(/preview/i).first()).toBeVisible();
  await expect(page.getByText("Goblin")).toBeVisible();
  await expect(page.getByText("Orc")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("system pack: clicking Import shows the result card with created count", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/import");

  const systemPackTab = page.getByRole("tab", { name: /system pack/i });
  if (await systemPackTab.isVisible()) {
    await systemPackTab.click();
  }

  const json = JSON.stringify([
    { name: "Goblin", cr: "1/4", type: "humanoid", ac: "15", hp: "7" },
  ]);

  await page.locator("input[type='file']").first().setInputFiles({
    name: "statblocks.json",
    mimeType: "application/json",
    buffer: Buffer.from(json),
  });

  // Wait for preview before clicking import
  await expect(page.getByText(/preview/i).first()).toBeVisible();

  await page.getByRole("button", { name: /import.*selected/i }).click();

  await expect(page.getByText(/import complete/i)).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("system pack: malformed JSON shows a parse error message", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/import");

  const systemPackTab = page.getByRole("tab", { name: /system pack/i });
  if (await systemPackTab.isVisible()) {
    await systemPackTab.click();
  }

  await page.locator("input[type='file']").first().setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{ this is: not valid JSON !! }"),
  });

  await expect(page.getByText(/invalid|parse error|failed to parse/i)).toBeVisible();
  await expectNoConsoleErrors(errors);
});

// ── Azgaar ───────────────────────────────────────────────────────────────────

test("Azgaar tab: uploading a map file shows the preview with map name", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/import");

  await page.getByRole("tab", { name: /azgaar/i }).click();

  const mapData = JSON.stringify({ info: { name: "Test Realm" }, states: [], burgs: [], religions: [], cultures: [], notes: [] });

  // Use the Azgaar-specific file input
  const azgaarSection = page.locator("[role='tabpanel']:visible");
  await azgaarSection.locator("input[type='file']").setInputFiles({
    name: "realm.json",
    mimeType: "application/json",
    buffer: Buffer.from(mapData),
  });

  await expect(page.getByText("Test Realm").first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("Azgaar tab: clicking Import shows result totals", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/import");

  await page.getByRole("tab", { name: /azgaar/i }).click();

  const mapData = JSON.stringify({ info: { name: "Test Realm" }, states: [], burgs: [], religions: [], cultures: [], notes: [] });

  const azgaarSection = page.locator("[role='tabpanel']:visible");
  await azgaarSection.locator("input[type='file']").setInputFiles({
    name: "realm.json",
    mimeType: "application/json",
    buffer: Buffer.from(mapData),
  });

  await expect(page.getByText("Test Realm").first()).toBeVisible();
  await page.getByRole("button", { name: /import.*Test Realm|import from/i }).click();

  await expect(page.getByText(/import complete/i)).toBeVisible();
  await expectNoConsoleErrors(errors);
});
