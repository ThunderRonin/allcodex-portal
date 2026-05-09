import { afterEach, describe, expect, it, vi } from "vitest";

import { searchBacklinks } from "./etapi-server";

const creds = { url: "http://allcodex.test", token: "token" };

describe("searchBacklinks", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("filters non-lore and self results out of backlink lookups", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              noteId: "note-current",
              title: "Current",
              attributes: [
                { attributeId: "a-self-lore", noteId: "note-current", type: "label", name: "lore", value: "", isInheritable: false },
              ],
            },
            {
              noteId: "note-lore",
              title: "Aether Keep",
              attributes: [
                { attributeId: "a-lore", noteId: "note-lore", type: "label", name: "lore", value: "", isInheritable: false },
                { attributeId: "a-type", noteId: "note-lore", type: "label", name: "loreType", value: "location", isInheritable: false },
              ],
            },
            {
              noteId: "note-system",
              title: "Hidden Notes",
              attributes: [],
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchBacklinks(creds, "note-current")).resolves.toEqual([
      { noteId: "note-lore", title: "Aether Keep", loreType: "location" },
    ]);
  });
});
