import { expect, test } from "@playwright/test";
import { expectNoConsoleErrors } from "./helpers/test-utils";
import { installPortalApiMocks } from "./helpers/mock-api";

test.describe("Timeline page", () => {
  test("renders event cards with in-world date, loreType badge, title, and description", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/timeline");

    await expect(page.getByRole("link", { name: "Founding of Aether Keep" })).toBeVisible();
    await expect(page.getByText("Year 12, Age of Embers")).toBeVisible();
    await expect(page.getByText("event").first()).toBeVisible();
    await expect(page.getByText("The fortress was raised on the ley breach.")).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("groups events by era with era heading visible", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page);
    await page.goto("/timeline");

    // Era heading h3 contains the era name (also appears in per-card badges)
    await expect(page.getByText("Age of Embers").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Founding of Aether Keep" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Aria Vale Appointed Warden" })).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("renders without era grouping when notes have no era attribute", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page, {
      timeline: [
        {
          noteId: "tl-x",
          title: "The Sundering",
          attributes: [
            { name: "lore", value: "", type: "label" },
            { name: "loreType", value: "event", type: "label" },
            { name: "inWorldDate", value: "Year 1", type: "label" },
          ],
        },
      ],
    });
    await page.goto("/timeline");

    await expect(page.getByRole("link", { name: "The Sundering" })).toBeVisible();
    // No era label → no era Badge rendered on the card
    await expect(page.getByText("Age of Embers")).not.toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("shows entry count badge matching number of events", async ({ page }) => {
    await installPortalApiMocks(page);
    await page.goto("/timeline");

    // Default 2 timeline notes → badge shows "2 entries"
    await expect(page.getByText("2 entries")).toBeVisible();
  });

  test("empty state shows informative message", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });

    await installPortalApiMocks(page, { timeline: [] });
    await page.goto("/timeline");

    await expect(page.getByText(/no timeline entries found/i)).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("error state shows failure message", async ({ page }) => {
    await installPortalApiMocks(page);
    // LIFO: registered after installPortalApiMocks so this wins
    await page.route("**/api/timeline**", async (route) => {
      await route.abort("failed");
    });
    await page.goto("/timeline");

    await expect(page.getByText(/failed to load timeline/i)).toBeVisible();
  });

  test("clicking event title navigates to lore detail page", async ({ page }) => {
    await installPortalApiMocks(page);
    await page.goto("/timeline");

    await page.getByRole("link", { name: "Founding of Aether Keep" }).click();
    await expect(page).toHaveURL(/\/lore\/tl-1/);
  });
});
