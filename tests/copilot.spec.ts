import { test, expect } from "@playwright/test";
import { buildNote, installPortalApiMocks } from "./helpers/mock-api";
import { attachConsoleErrorCollector, expectNoConsoleErrors } from "./helpers/test-utils";

test.describe("Article Copilot", () => {
  test("opens copilot, receives proposal, and applies selected targets", async ({ page }) => {
    const errors = attachConsoleErrorCollector(page);
    await installPortalApiMocks(page, {
      notes: [
        buildNote({
          noteId: "note-1",
          title: "Aria Vale",
          content: "<p>Original content</p>",
        }),
      ],
    });

    // Mock copilot chat response
    await page.route("**/api/lore/note-1/copilot/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          assistantMessage: "Here is a proposal.",
          citations: [],
          proposal: {
            targets: [
              {
                kind: "update",
                targetId: "note-1",
                title: "Aria Vale, the Warden",
                contentHtml: "<p>Updated content</p>",
                labelUpserts: [],
                labelDeletes: [],
                relationAdds: [],
                relationDeletes: [],
                rationale: "Added title.",
              },
            ],
          },
        }),
      });
    });

    // Mock copilot apply response
    await page.route("**/api/lore/note-1/copilot/apply", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applied: {
            updatedNoteIds: ["note-1"],
            createdNoteIds: [],
            skipped: [],
            failed: [],
          },
        }),
      });
    });

    // Open detail page
    await page.goto("/lore/note-1");

    // Click copilot trigger
    await page.getByRole("button", { name: /lore copilot/i }).click();
    await expect(page.getByRole("heading", { name: "Article-Scoped Copilot" })).toBeVisible();

    // Send a message
    await page.getByPlaceholder(/Ask for article edits/i).fill("Make her sound more epic");
    await page.getByRole("button", { name: /^Send$/i }).click();

    // Verify proposal card is displayed
    await expect(page.getByText("Aria Vale, the Warden").first()).toBeVisible();
    await expect(page.getByText("Review Proposal")).toBeVisible();

    // Check the target checkbox
    await page.getByRole("checkbox").first().check({ force: true });

    // Apply the proposal
    await page.getByRole("button", { name: "Apply Selected" }).evaluate(el => (el as HTMLElement).click());

    // Verify confirmation dialog
    await expect(page.getByRole("dialog").getByText(/This will write 1 selected target/i)).toBeVisible();
    await page.getByRole("button", { name: /Write to Codex/i }).click();

    // Verify success banner
    await expect(page.getByText("Apply completed")).toBeVisible();
    await expect(page.getByText("Updated: note-1")).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("can cancel a proposal and redirect with instructions", async ({ page }) => {
    const errors = attachConsoleErrorCollector(page);
    await installPortalApiMocks(page, {
      notes: [
        buildNote({
          noteId: "note-1",
          title: "Aria Vale",
        }),
      ],
    });

    let chatCallCount = 0;
    await page.route("**/api/lore/note-1/copilot/chat", async (route) => {
      chatCallCount++;
      const request = await route.request().postDataJSON();
      const lastMessage = request.messages[request.messages.length - 1].content;

      if (chatCallCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            assistantMessage: "Here is a proposal.",
            citations: [],
            proposal: {
              targets: [
                {
                  kind: "update",
                  targetId: "note-1",
                  title: "Aria Vale, the Warden",
                  rationale: "Added title.",
                  labelUpserts: [],
                  labelDeletes: [],
                  relationAdds: [],
                  relationDeletes: [],
                },
              ],
            },
          }),
        });
      } else {
        expect(lastMessage).toContain("I'm rejecting the previous proposal. Instead: Fix the spelling");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            assistantMessage: "Understood, providing a new proposal.",
            citations: [],
            proposal: null,
          }),
        });
      }
    });

    await page.goto("/lore/note-1");
    await page.getByRole("button", { name: /lore copilot/i }).click();

    await page.getByPlaceholder(/Ask for article edits/i).fill("Make her sound more epic");
    await page.getByRole("button", { name: /^Send$/i }).click();

    await expect(page.getByText("Aria Vale, the Warden").first()).toBeVisible();

    // Click Cancel + Redirect
    await page.getByRole("button", { name: /Cancel \+ Redirect/i }).click();

    // Fill instructions
    await page.getByPlaceholder(/Instead of this proposal, please/i).fill("Fix the spelling");
    await page.locator('button:has-text("Send Revision")').evaluate(el => (el as HTMLElement).click());

    // Wait for the response and assert that the proposal card disappears
    await expect(page.getByText("Understood, providing a new proposal.")).toBeVisible();
    await expect(page.getByText("Aria Vale, the Warden").first()).toHaveCount(0);

    await expectNoConsoleErrors(errors);
  });

  test("shows error message when copilot chat fails", async ({ page }) => {
    await installPortalApiMocks(page, {
      notes: [buildNote({ noteId: "note-1", title: "Aria Vale" })],
    });

    await page.route("**/api/lore/note-1/copilot/chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "LLM_TIMEOUT", message: "The model timed out." }),
      });
    });

    await page.goto("/lore/note-1");
    await page.getByRole("button", { name: /lore copilot/i }).click();

    await page.getByPlaceholder(/Ask for article edits/i).fill("Make her sound more epic");
    await page.getByRole("button", { name: /^Send$/i }).click();

    await expect(page.getByText(/The model timed out./i)).toBeVisible();
  });

  test("can cancel a proposal without redirecting", async ({ page }) => {
    const errors = attachConsoleErrorCollector(page);
    await installPortalApiMocks(page, {
      notes: [buildNote({ noteId: "note-1", title: "Aria Vale" })],
    });

    await page.route("**/api/lore/note-1/copilot/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          assistantMessage: "Here is a proposal.",
          citations: [],
          proposal: {
            targets: [{ 
              kind: "update", 
              targetId: "note-1", 
              title: "Aria Vale",
              contentHtml: "<p>Updated</p>",
              labelUpserts: [], labelDeletes: [], relationAdds: [], relationDeletes: []
            }],
          },
        }),
      });
    });

    await page.goto("/lore/note-1");
    await page.getByRole("button", { name: /lore copilot/i }).click();

    await page.getByPlaceholder(/Ask for article edits/i).fill("Make her sound more epic");
    await page.getByRole("button", { name: /^Send$/i }).click();

    await expect(page.getByText("Review Proposal")).toBeVisible();

    // Click plain Cancel
    await page.getByRole("button", { name: /^Cancel$/i }).click();

    // Proposal should disappear, message should remain
    await expect(page.getByText("Review Proposal")).toHaveCount(0);
    await expect(page.getByText("Here is a proposal.")).toBeVisible();

    await expectNoConsoleErrors(errors);
  });

  test("handles multi-target proposal with partial selection", async ({ page }) => {
    const errors = attachConsoleErrorCollector(page);
    await installPortalApiMocks(page, {
      notes: [
        buildNote({ noteId: "note-1", title: "Aria Vale" }),
        buildNote({ noteId: "new-1", title: "Target 2" }),
      ],
    });

    await page.route("**/api/lore/note-1/copilot/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          assistantMessage: "Here is a multi-target proposal.",
          citations: [],
          proposal: {
            targets: [
              { 
                kind: "update", targetId: "note-1", title: "Target 1",
                contentHtml: "<p>1</p>", labelUpserts: [], labelDeletes: [], relationAdds: [], relationDeletes: []
              },
              { 
                kind: "create", targetId: "new-1", title: "Target 2",
                contentHtml: "<p>2</p>", labelUpserts: [], labelDeletes: [], relationAdds: [], relationDeletes: []
              },
            ],
          },
        }),
      });
    });

    let appliedTargets: any[] = [];
    await page.route("**/api/lore/note-1/copilot/apply", async (route) => {
      const body = route.request().postDataJSON();
      appliedTargets = body.approvedTargetIds;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          applied: { updatedNoteIds: ["note-1"], createdNoteIds: [], skipped: [], failed: [] },
        }),
      });
    });

    await page.goto("/lore/note-1");
    await page.getByRole("button", { name: /lore copilot/i }).click();
    await page.getByPlaceholder(/Ask for article edits/i).fill("do it");
    await page.getByRole("button", { name: /^Send$/i }).click();

    // Both targets should be visible and checked
    await expect(page.getByText("Target 1").first()).toBeVisible();
    await expect(page.getByText("Target 2").first()).toBeVisible();

    // Uncheck the second target
    const checkboxes = page.getByRole("checkbox");
    await checkboxes.nth(1).evaluate(el => (el as HTMLElement).click());

    // Apply selected
    await page.getByRole("button", { name: "Apply Selected" }).evaluate(el => (el as HTMLElement).click());
    
    // Confirm dialog
    await expect(page.getByRole("dialog").getByText(/This will write 1 selected target/i)).toBeVisible();
    await page.getByRole("button", { name: /Write to Codex/i }).click();

    await expect(page.getByText("Apply completed")).toBeVisible();
    expect(appliedTargets).toHaveLength(1);
    expect(appliedTargets[0]).toBe("note-1");

  });
});

