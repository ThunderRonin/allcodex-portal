import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

/** Override the config/status route to return disconnected state.
 *  Must be called AFTER installPortalApiMocks because Playwright uses LIFO for route matching. */
async function setDisconnected(page: import("@playwright/test").Page) {
  await page.route("**/api/config/status**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        allcodex: { connected: false, url: "http://localhost:8080" },
        allknower: { connected: false, url: "http://localhost:3001" },
      }),
    });
  });
}

test("renders AllCodex and AllKnower status cards", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/settings");

  await expect(page.getByText(/allcodex/i).first()).toBeVisible();
  await expect(page.getByText(/allknower/i).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("ETAPI token connect flow calls POST /api/config/connect", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);
  await setDisconnected(page);

  const connectCalled = { value: false };
  await page.route("**/api/config/connect", async (route) => {
    connectCalled.value = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.goto("/settings");

  await page.locator("#allcodex-token").fill("test-token-abc");
  await page.getByRole("button", { name: /^connect$/i }).first().click();

  expect(connectCalled.value).toBe(true);
  await expectNoConsoleErrors(errors);
});

test("AllCodex password login flow calls POST /api/config/allcodex-login", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);
  await setDisconnected(page);

  const loginCalled = { value: false };
  await page.route("**/api/config/allcodex-login", async (route) => {
    loginCalled.value = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.goto("/settings");

  await page.getByRole("tab", { name: /password login/i }).click();
  await page.locator("#allcodex-password").fill("my-password");
  await page.getByRole("button", { name: /login/i }).first().click();

  expect(loginCalled.value).toBe(true);
  await expectNoConsoleErrors(errors);
});

test("AllKnower register mode calls POST /api/config/allknower-register", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);
  await setDisconnected(page);

  const registerCalled = { value: false };
  await page.route("**/api/config/allknower-register", async (route) => {
    registerCalled.value = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.goto("/settings");

  // Switch AllKnower section to register mode
  await page.getByRole("button", { name: /^register$/i }).click();

  await page.locator("#ak-reg-name").fill("Test User");
  await page.locator("#ak-reg-email").fill("test@example.com");
  await page.locator("#ak-reg-password").fill("password123");
  // The submit button in register mode is labelled "Register", not "Create Account"
  await page.getByRole("button", { name: /^register$/i }).last().click();

  expect(registerCalled.value).toBe(true);
  await expectNoConsoleErrors(errors);
});

test("Disconnect AllCodex calls DELETE or POST /api/config/disconnect", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  const disconnectCalled = { value: false };
  await page.route("**/api/config/disconnect**", async (route) => {
    disconnectCalled.value = true;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.goto("/settings");

  // Should be connected by default (configStatus default has connected: true)
  await page.getByRole("button", { name: /^disconnect$/i }).first().click();

  expect(disconnectCalled.value).toBe(true);
  await expectNoConsoleErrors(errors);
});
