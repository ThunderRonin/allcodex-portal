import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("shows relationship suggestions and gap detection results", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/ai/relationships");
  await page.getByPlaceholder(/paste the text of a lore entry here/i).fill("Aria Vale defends Aether Keep.");
  await page.getByRole("button", { name: /find connections/i }).click();
  await expect(page.getByText(/suggested connections/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Aether Keep/i })).toBeVisible();

  await page.goto("/ai/gaps");
  await page.getByRole("button", { name: /scan for gaps|re-scan chronicle/i }).click();
  await expect(page.getByText("Factions")).toBeVisible();
  await expect(page.getByText(/rival guild/i)).toBeVisible();

  await expectNoConsoleErrors(errors);
});

test("shows mention autocomplete suggestions in the lore editor", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/lore/new");
  await page.locator("#title").fill("Autocomplete Trial");
  await page.locator(".bn-editor").click();
  await page.locator(".bn-editor").pressSequentially("@Ae");

  await expect(page.getByText("Aether Keep")).toBeVisible();
  await expect(page.getByText("location")).toBeVisible();

  await expectNoConsoleErrors(errors);
});