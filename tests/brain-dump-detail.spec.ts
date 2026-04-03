import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors } from "./helpers/test-utils";
import { installPortalApiMocks } from "./helpers/mock-api";

const mockEntry = {
  id: "abc-1",
  rawText: "The wardens swore the Vault Oath beneath the moonwell.",
  summary: "Vault Oath event captured.",
  notesCreated: ["brain-note-1"],
  notesUpdated: [],
  model: "gpt-4o-mini",
  tokensUsed: 312,
  createdAt: new Date().toISOString(),
  parsedJson: {
    entities: [
      {
        noteId: "brain-note-1",
        title: "Vault Oath",
        type: "event",
        action: "created",
      },
    ],
    summary: "Vault Oath event captured.",
  },
};

async function setupDetailPage(page: import("@playwright/test").Page) {
  await installPortalApiMocks(page);
  // LIFO: registered after installPortalApiMocks so this route wins for /api/brain-dump/history/*
  await page.route("**/api/brain-dump/history/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockEntry),
    });
  });
}

test.describe("Brain Dump detail page", () => {
  test("back button links to brain dump list", async ({ page }) => {
    await setupDetailPage(page);
    await page.goto("/brain-dump/abc-1");

    const backLink = page.getByRole("link", { name: /brain dump/i }).first();
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute("href", "/brain-dump");
  });

  test("shows metadata with model name and token count", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await setupDetailPage(page);
    await page.goto("/brain-dump/abc-1");

    await expect(page.getByText("gpt-4o-mini")).toBeVisible();
    // tokensUsed: 312 → "312 tokens"
    await expect(page.getByText(/312.*tokens/i)).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("shows raw input text", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await setupDetailPage(page);
    await page.goto("/brain-dump/abc-1");

    await expect(
      page.getByText("The wardens swore the Vault Oath beneath the moonwell."),
    ).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("shows AI summary section", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await setupDetailPage(page);
    await page.goto("/brain-dump/abc-1");

    await expect(page.getByText("Vault Oath event captured.").first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("shows entity cards with title and action badge", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await setupDetailPage(page);
    await page.goto("/brain-dump/abc-1");

    // Entity title in a link/card
    await expect(page.getByText("Vault Oath").first()).toBeVisible();
    // Action badge
    await expect(page.getByText("created").first()).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("error state shows failure message", async ({ page }) => {
    await installPortalApiMocks(page);
    // Abort after installPortalApiMocks so LIFO makes this take precedence
    await page.route("**/api/brain-dump/history/**", async (route) => {
      await route.abort("failed");
    });
    await page.goto("/brain-dump/abc-1");

    await expect(page.getByText(/failed to load entry/i)).toBeVisible();
  });
});
