import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("submits a brain dump and shows loading plus results", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    brainDump: {
      delayMs: 250,
      body: {
        mode: "auto",
        summary: "Extracted the Vault Oath.",
        created: [{ noteId: "brain-1", title: "Vault Oath", type: "event", action: "created" }],
        updated: [],
        skipped: [],
      },
    },
  });

  await page.goto("/brain-dump");

  await page.getByPlaceholder(/write anything/i).fill("The wardens swore the Vault Oath beneath the moonwell.");
  await page.getByRole("button", { name: /process with allknower/i }).click();

  await expect(page.getByRole("button", { name: /processing/i })).toBeVisible();
  await expect(page.getByText("Extracted the Vault Oath.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Vault Oath/i })).toBeVisible();

  await expectNoConsoleErrors(errors);
});

test("shows a service error state when AllKnower is unavailable for brain dump", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    brainDump: {
      status: 503,
      body: { error: "UNREACHABLE", message: "AllKnower unavailable" },
    },
  });

  await page.goto("/brain-dump");
  await page.getByPlaceholder(/write anything/i).fill("A broken request should still show a service banner.");
  await page.getByRole("button", { name: /process with allknower/i }).click();

  await expect(page.getByText("AllKnower unavailable").first()).toBeVisible();
  await expect(errors.filter((error) => !error.includes("503 (Service Unavailable)"))).toHaveLength(0);
});