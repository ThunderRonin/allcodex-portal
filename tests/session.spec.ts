import { test, expect } from "@playwright/test";
import { installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test("quick-capture submit shows entity pills", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    brainDump: {
      body: {
        mode: "auto",
        summary: "Extracted the Vault Oath.",
        created: [{ noteId: "brain-1", title: "Vault Oath", type: "event", action: "created" }],
        updated: [],
        skipped: [],
      },
    },
  });

  await page.goto("/session");

  const captureArea = page.getByPlaceholder(/jot down/i);
  await captureArea.fill("The wardens swore the Vault Oath beneath the moonwell.");
  await page.getByRole("button", { name: /send to lore/i }).click();

  await expect(page.getByText("Vault Oath")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("quick-capture shows failure message on brain dump error", async ({ page }) => {
  await installPortalApiMocks(page);
  // abort() causes fetch to throw, triggering captureMutation.isError
  await page.route("**/api/brain-dump", async (route) => {
    if (route.request().method() === "POST") {
      await route.abort("failed");
    } else {
      await route.fallback();
    }
  });

  await page.goto("/session");

  const captureArea = page.getByPlaceholder(/jot down/i);
  await captureArea.fill("A failed capture.");
  await page.getByRole("button", { name: /send to lore/i }).click();

  await expect(page.getByText("Capture failed — check AllKnower connection")).toBeVisible();
});

test("pin search shows matching notes and adds a pin on click", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/session");

  const pinInput = page.getByPlaceholder(/search to pin/i);
  await pinInput.fill("Aria");

  await expect(page.getByText("Aria Vale").first()).toBeVisible();
  await page.getByText("Aria Vale").first().click();

  // Pin should now be visible as a link
  await expect(page.getByRole("link", { name: /Aria Vale/i })).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("statblock lookup renders a StatblockCard for the selected result", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  // Override the statblock search route to return full note objects with attributes
  await page.route("**/api/search**", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") ?? "";
    if (q.toLowerCase().includes("statblock")) {
      await route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify([{
          noteId: "sb-cave-bear",
          title: "Cave Bear",
          attributes: [
            { name: "cr", value: "2", type: "label" },
            { name: "ac", value: "11", type: "label" },
            { name: "hp", value: "42", type: "label" },
            { name: "speed", value: "40 ft.", type: "label" },
            { name: "str", value: "20", type: "label" },
            { name: "dex", value: "10", type: "label" },
          ],
        }]),
      });
    } else {
      await route.fallback();
    }
  });

  await page.goto("/session");

  const statblockInput = page.getByPlaceholder(/search statblocks/i);
  await statblockInput.fill("Ca");

  await expect(page.getByText("Cave Bear").first()).toBeVisible();
  await page.getByText("Cave Bear").first().click();

  // StatblockCard should show CR or AC stat
  await expect(page.getByText(/Armor Class|AC/i).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("recap section renders brain dump history entries", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    brainDumpHistory: [
      { id: "hist-1", rawText: "Three fragments of ancient lore", summary: "Extracted three fragments", notesCreated: ["n-1", "n-2", "n-3"], notesUpdated: [], model: "gpt-4o-mini", tokensUsed: 200, createdAt: new Date(Date.now() - 3_600_000).toISOString() },
    ],
  });

  await page.goto("/session");

  // Either the summary text or the entity count should be visible in the Recap section
  await expect(page.getByText(/extracted three fragments|3 entr/i).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});
