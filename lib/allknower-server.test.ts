import { beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceError } from "./route-error";

// ── Fetch mock ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", mockFetch);

function makeOkResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

function makeErrorResponse(status: number, body = ""): Response {
  return {
    ok: false,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  } as unknown as Response;
}

const creds = { url: "http://allknower.test", token: "test-token" };

// ── Import after stubbing globals ─────────────────────────────────────────────

import {
  getBrainDumpHistory,
  getBrainDumpEntry,
  runBrainDump,
  commitBrainDump,
  queryRag,
  getHealth,
} from "./allknower-server";

describe("allknower-server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getBrainDumpHistory ────────────────────────────────────────────────────

  describe("getBrainDumpHistory", () => {
    const entry = {
      id: "hist-1",
      rawText: "The wardens swore the Vault Oath.",
      summary: "Vault Oath captured.",
      notesCreated: ["note-1"],
      notesUpdated: [],
      model: "gpt-4o-mini",
      tokensUsed: 312,
      createdAt: new Date().toISOString(),
      entities: null,
    };

    it("handles a flat array response (legacy format)", async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse([entry]));

      const result = await getBrainDumpHistory(creds);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("hist-1");
    });

    it("handles a paginated { items } response (new format)", async () => {
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ items: [entry], total: 1, page: 1, pageSize: 20 })
      );

      const result = await getBrainDumpHistory(creds);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("hist-1");
    });

    it("returns empty array when items is empty", async () => {
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ items: [], total: 0, page: 1, pageSize: 20 })
      );

      const result = await getBrainDumpHistory(creds);

      expect(result).toEqual([]);
    });

    it("returns empty array for flat empty array response", async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse([]));

      const result = await getBrainDumpHistory(creds);

      expect(result).toEqual([]);
    });

    it("throws ServiceError on 401", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(401));

      await expect(getBrainDumpHistory(creds)).rejects.toThrow(ServiceError);
    });

    it("throws ServiceError on 502", async () => {
      mockFetch.mockResolvedValueOnce(makeErrorResponse(502, "bad gateway"));

      await expect(getBrainDumpHistory(creds)).rejects.toThrow(ServiceError);
    });

    it("throws ServiceError when fetch rejects (network error)", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Network failure"));

      await expect(getBrainDumpHistory(creds)).rejects.toThrow(ServiceError);
    });
  });

  // ── getBrainDumpEntry ──────────────────────────────────────────────────────

  describe("getBrainDumpEntry", () => {
    it("fetches the correct entry by id", async () => {
      const detail = {
        id: "hist-99",
        rawText: "A dark pact was forged.",
        summary: "Pact documented.",
        notesCreated: [],
        notesUpdated: ["note-5"],
        model: "gpt-4o",
        tokensUsed: 88,
        createdAt: new Date().toISOString(),
        entities: null,
        parsedJson: null,
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(detail));

      const result = await getBrainDumpEntry(creds, "hist-99");

      expect(result.id).toBe("hist-99");
      expect(result.rawText).toBe("A dark pact was forged.");
      // Verify the URL was constructed correctly (id must be encoded)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/brain-dump/history/hist-99"),
        expect.any(Object)
      );
    });
  });

  // ── runBrainDump ──────────────────────────────────────────────────────────

  describe("runBrainDump", () => {
    it("sends rawText and mode, returns result", async () => {
      const brainResult = {
        mode: "auto",
        summary: "Created 1 note.",
        created: [{ noteId: "n1", title: "Vault Oath", type: "event" }],
        updated: [],
        skipped: [],
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(brainResult));

      const result = await runBrainDump(creds, "The wardens swore the Vault Oath.", "auto");

      expect(result).toMatchObject({ mode: "auto", summary: "Created 1 note." });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/brain-dump"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("defaults mode to auto when not specified", async () => {
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ mode: "auto", summary: "ok", created: [], updated: [], skipped: [] })
      );

      await runBrainDump(creds, "some text");

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body.mode).toBe("auto");
    });
  });

  // ── commitBrainDump ───────────────────────────────────────────────────────

  describe("commitBrainDump", () => {
    it("POSTs to /brain-dump/commit with approved entities", async () => {
      const commitResult = {
        mode: "auto",
        summary: "Committed.",
        created: [],
        updated: [],
        skipped: [],
      };
      mockFetch.mockResolvedValueOnce(makeOkResponse(commitResult));

      await commitBrainDump(creds, "text", []);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/brain-dump/commit"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  // ── queryRag ──────────────────────────────────────────────────────────────

  describe("queryRag", () => {
    it("returns results array from { results } response", async () => {
      const chunks = [
        { noteId: "n1", noteTitle: "Vault Oath", content: "The wardens...", score: 0.92 },
      ];
      mockFetch.mockResolvedValueOnce(makeOkResponse({ results: chunks }));

      const result = await queryRag(creds, "vault oath");

      expect(result).toHaveLength(1);
      expect(result[0].noteId).toBe("n1");
    });

    it("returns empty array when results key is absent", async () => {
      mockFetch.mockResolvedValueOnce(makeOkResponse({}));

      const result = await queryRag(creds, "anything");

      expect(result).toEqual([]);
    });
  });

  // ── getHealth ─────────────────────────────────────────────────────────────

  describe("getHealth", () => {
    it("returns health status object", async () => {
      mockFetch.mockResolvedValueOnce(
        makeOkResponse({ status: "ok", allcodex: "ok", ollama: "ok" })
      );

      const result = await getHealth(creds);

      expect(result.status).toBe("ok");
    });
  });
});
