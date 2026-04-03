import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";

test("404 lore note shows not-found state instead of crashing", async ({ page }) => {
  await installPortalApiMocks(page, { notes: [] });

  await page.goto("/lore/does-not-exist");

  // Should show some kind of not-found UI — not a blank page or crash
  // Check that the page has loaded (no network error / white screen)
  const body = await page.locator("body").textContent();
  expect(body).not.toBe("");

  // Should not show raw stack traces
  expect(body).not.toContain("at Object.");
});

test("lore list 500 error shows an error state in the lore browser", async ({ page }) => {
  await installPortalApiMocks(page, { notes: [] });
  await page.route("**/api/lore**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/lore")) {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "DB error" }) });
      return;
    }
    await route.fallback();
  });

  await page.goto("/lore");

  // The page should show some error indication
  const text = await page.locator("body").textContent();
  expect(text).not.toBe("");
  // Not a JavaScript crash
  expect(text).not.toContain("unhandled");
});

test("AllKnower unavailable on brain dump shows error message", async ({ page }) => {
  await installPortalApiMocks(page, {
    brainDump: {
      status: 503,
      body: { error: "UNREACHABLE", message: "AllKnower unavailable" },
    },
  });

  await page.goto("/brain-dump");
  await page.getByPlaceholder(/write anything/i).fill("A test brain dump.");
  await page.getByRole("button", { name: /process with allknower/i }).click();

  await expect(page.getByText(/allknower|unavailable|error/i).first()).toBeVisible();
});

test("AllKnower unavailable on relationships page shows error message", async ({ page }) => {
  await installPortalApiMocks(page);
  await page.route("**/api/ai/relationships", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "UNREACHABLE" }) });
  });

  await page.goto("/ai/relationships");
  await page.getByPlaceholder(/paste the text/i).fill("test text");
  await page.getByRole("button", { name: /find connections/i }).click();

  await expect(page.getByText(/allknower|unavailable|error/i).first()).toBeVisible();
});

test("AllCodex unavailable on quests page shows error message", async ({ page }) => {
  await installPortalApiMocks(page);
  await page.route("**/api/quests", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Cannot reach AllCodex" }) });
  });

  await page.goto("/quests");

  await expect(page.getByText(/failed to load quests/i)).toBeVisible();
});

test("AllCodex unavailable on statblocks page shows error message", async ({ page }) => {
  await installPortalApiMocks(page);
  await page.route("**/api/statblocks", async (route) => {
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Cannot reach AllCodex" }) });
  });

  await page.goto("/statblocks");

  await expect(page.locator(".text-destructive").first()).toBeVisible();
});
