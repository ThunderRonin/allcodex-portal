import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("statblock list renders with name and CR badge", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/statblocks");

  await expect(page.getByText("Cave Bear")).toBeVisible();
  await expect(page.getByText("Shadow Wraith")).toBeVisible();
  // CR badges
  await expect(page.getByText(/CR 2/).first()).toBeVisible();
  await expect(page.getByText(/CR 5/).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("clicking a statblock entry shows the StatblockCard in the right pane", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/statblocks");

  await page.getByText("Cave Bear").click();

  // StatblockCard should appear with full detail
  await expect(page.getByText("Armor Class").first()).toBeVisible();
  await expect(page.getByText("Hit Points").first()).toBeVisible();
  await expect(page.getByText(/beast/i).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("StatblockCard renders ability scores with correct modifiers", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/statblocks");

  await page.getByText("Cave Bear").click();

  // STR 20 → modifier +5
  await expect(page.getByText(/\+5/).first()).toBeVisible();
  // DEX 10 → modifier +0
  await expect(page.getByText(/\+0/).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("search filter narrows the statblock list", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/statblocks");

  await expect(page.getByText("Cave Bear")).toBeVisible();
  await expect(page.getByText("Shadow Wraith")).toBeVisible();

  await page.getByPlaceholder(/search/i).fill("cave");

  await expect(page.getByText("Cave Bear")).toBeVisible();
  await expect(page.getByText("Shadow Wraith")).not.toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("CR range filter hides entries outside the range", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/statblocks");

  await expect(page.getByText("Cave Bear")).toBeVisible();
  await expect(page.getByText("Shadow Wraith")).toBeVisible();

  // Click "5–14" CR filter
  await page.getByRole("button", { name: /5.?14/i }).click();

  // Cave Bear is CR 2, should be hidden; Shadow Wraith is CR 5, should be visible
  await expect(page.getByText("Shadow Wraith")).toBeVisible();
  await expect(page.getByText("Cave Bear")).not.toBeVisible();
  await expectNoConsoleErrors(errors);
});
