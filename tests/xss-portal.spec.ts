import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("strips script execution from rendered portal lore content", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [],
  });

  await page.addInitScript(() => {
    (window as Window & { __xssFired?: boolean }).__xssFired = false;
    window.alert = () => {
      (window as Window & { __xssFired?: boolean }).__xssFired = true;
    };
  });

  await page.goto("/lore/new");
  await page.locator("#title").fill("XSS Specimen");
  await page.locator(".bn-editor").click();
  await page.locator(".bn-editor").pressSequentially("<script>alert(1)</script>");
  await page.getByRole("button", { name: /create entry/i }).click();

  // Force the mocked detail payload to represent hostile stored HTML.
  // The UI path under test is still the real sanitizeLoreHtml() render path.
  await page.route("**/api/lore/note-1/content", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: "<h1>XSS Specimen</h1><p>Safe body</p><script>alert(1)</script><img src=\"x\" onerror=\"alert(2)\">",
    });
  });

  await page.goto("/lore/note-1");
  const content = await page.locator(".lore-content").innerHTML();

  expect(content).toContain("Safe body");
  expect(content).not.toContain("<script");
  expect(content).not.toContain("onerror=");

  const xssFired = await page.evaluate(() => (window as Window & { __xssFired?: boolean }).__xssFired === true);
  expect(xssFired).toBe(false);

  await page.screenshot({ path: test.info().outputPath("portal-xss.png"), fullPage: true });
  await expectNoConsoleErrors(errors);
});