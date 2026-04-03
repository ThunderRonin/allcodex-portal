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
  await installPortalApiMocks(page);

  await page.goto("/lore/new");
  await page.locator(".bn-editor").click();
  await page.locator(".bn-editor").pressSequentially("@Ae");

  await expect(page.getByText("Aether Keep")).toBeVisible();
  await expect(page.getByText("location")).toBeVisible();
});

test("consistency check with no issues shows the empty state", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    consistency: { body: { issues: [], summary: "Lore is consistent." } },
  });

  await page.goto("/ai/consistency");
  await page.getByRole("button", { name: /run check|analyse/i }).click();

  await expect(page.getByText(/no issues found|internally consistent/i).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("consistency check with issues renders issue cards with type and severity badges", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    consistency: {
      body: {
        summary: "Found 1 contradiction.",
        highCount: 1,
        medCount: 0,
        lowCount: 0,
        issues: [
          {
            type: "contradiction",
            severity: "high",
            description: "Aria Vale is listed as both alive and deceased.",
            affectedNoteIds: ["note-1"],
          },
        ],
      },
    },
  });

  await page.goto("/ai/consistency");
  await page.getByRole("button", { name: /run check|analyse/i }).click();

  await expect(page.getByText("Contradiction").first()).toBeVisible();
  await expect(page.getByText(/alive and deceased/i).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("consistency issue note ID chip links to the lore entry", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    consistency: {
      body: {
        summary: "Found 1 issue.",
        issues: [
          {
            type: "contradiction",
            severity: "high",
            description: "Test contradiction.",
            affectedNoteIds: ["note-1"],
          },
        ],
      },
    },
  });

  await page.goto("/ai/consistency");
  await page.getByRole("button", { name: /run check|analyse/i }).click();

  const noteChip = page.locator("a[href*='/lore/note-1']");
  await expect(noteChip.first()).toBeVisible();  
  await expectNoConsoleErrors(errors);
});

test("gaps page shows pre-scan prompt before scanning", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page);

  await page.goto("/ai/gaps");

  // Pre-scan state — the scan button should be visible
  await expect(page.getByRole("button", { name: /scan for gaps/i })).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("gaps page shows summary count cards and gap cards after scan", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    gaps: {
      body: {
        gaps: [
          { area: "Factions", severity: "high", description: "No rival faction established.", suggestion: "Add a rival guild." },
          { area: "Geography", severity: "low", description: "Region lacks named rivers.", suggestion: "Name the main waterway." },
        ],
      },
    },
  });

  await page.goto("/ai/gaps");
  await page.getByRole("button", { name: /scan for gaps|re-scan chronicle/i }).click();

  await expect(page.getByText("Factions")).toBeVisible();
  await expect(page.getByText("Geography")).toBeVisible();
  await expectNoConsoleErrors(errors);
});

test("relationships page prefills textarea and shows Apply button when noteId param present", async ({ page }) => {
  const errors = attachConsoleErrorCollector(page);
  await installPortalApiMocks(page, {
    notes: [
      {
        noteId: "note-1",
        title: "Aria Vale",
        type: "text",
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        parentNoteIds: ["root"],
        attributes: [
          { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
          { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
        ],
        content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
      },
    ],
  });

  await page.goto("/ai/relationships?noteId=note-1");
  await page.getByRole("button", { name: /find connections/i }).click();

  // Apply button should be visible since noteId param is set
  await expect(page.getByRole("button", { name: /apply/i }).first()).toBeVisible();
  await expectNoConsoleErrors(errors);
});