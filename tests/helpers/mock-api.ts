import type { Page, Route } from "@playwright/test";

type Attribute = {
  attributeId: string;
  name: string;
  value: string;
  type: "label" | "relation";
};

type NoteRecord = {
  noteId: string;
  title: string;
  type: string;
  dateCreated: string;
  dateModified: string;
  attributes: Attribute[];
  parentNoteIds: string[];
  content: string;
};

type BrainDumpResponse = {
  status?: number;
  body: unknown;
  delayMs?: number;
};

type RelationshipsResponse = {
  suggestions: Array<{
    targetNoteId: string;
    targetTitle: string;
    relationshipType: string;
    description: string;
  }>;
};

type GapsResponse = {
  status?: number;
  body: unknown;
};

type MentionSuggestion = {
  noteId: string;
  title: string;
  loreType: string;
};

export type PortalMockOptions = {
  notes?: NoteRecord[];
  ragStatus?: { indexedNotes: number; model: string };
  brainDump?: BrainDumpResponse;
  relationships?: RelationshipsResponse;
  gaps?: GapsResponse;
  mentionSuggestions?: MentionSuggestion[];
};

export function buildNote(overrides: Partial<NoteRecord> & Pick<NoteRecord, "noteId" | "title">): NoteRecord {
  const now = new Date().toISOString();
  return {
    noteId: overrides.noteId,
    title: overrides.title,
    type: overrides.type ?? "text",
    dateCreated: overrides.dateCreated ?? now,
    dateModified: overrides.dateModified ?? now,
    parentNoteIds: overrides.parentNoteIds ?? ["root"],
    attributes: overrides.attributes ?? [
      { attributeId: `attr-lore-${overrides.noteId}`, name: "lore", value: "", type: "label" },
      { attributeId: `attr-type-${overrides.noteId}`, name: "loreType", value: "character", type: "label" },
    ],
    content: overrides.content ?? `<h1>${escapeHtml(overrides.title)}</h1><p>Chronicle entry body.</p>`,
  };
}

export async function installPortalApiMocks(page: Page, options: PortalMockOptions = {}) {
  const notes = new Map<string, NoteRecord>();
  const orderedNoteIds: string[] = [];
  const ragStatus = options.ragStatus ?? { indexedNotes: 3, model: "mock-embedder" };
  const brainDump = options.brainDump ?? {
    body: {
      mode: "auto",
      summary: "Extracted two lore fragments",
      created: [{ noteId: "brain-1", title: "Vault Oath", type: "event", action: "created" }],
      updated: [],
      skipped: [],
    },
    delayMs: 150,
  };
  const relationships = options.relationships ?? {
    suggestions: [
      {
        targetNoteId: "ally-1",
        targetTitle: "Aether Keep",
        relationshipType: "ally",
        description: "Supports the current lore entry.",
      },
    ],
  };
  const gaps = options.gaps ?? {
    body: {
      gaps: [
        {
          area: "Factions",
          severity: "medium",
          description: "Political structure is still thin.",
          suggestion: "Add a rival guild to anchor the region.",
        },
      ],
    },
  };
  const mentionSuggestions = options.mentionSuggestions ?? [
    { noteId: "mention-1", title: "Aether Keep", loreType: "location" },
    { noteId: "mention-2", title: "Aria Vale", loreType: "character" },
  ];

  const seedNotes = options.notes ?? [
    buildNote({
      noteId: "note-1",
      title: "Aria Vale",
      attributes: [
        { attributeId: "attr-lore-note-1", name: "lore", value: "", type: "label" },
        { attributeId: "attr-type-note-1", name: "loreType", value: "character", type: "label" },
      ],
      content: "<h1>Aria Vale</h1><p>Warden of the northern archive.</p>",
    }),
    buildNote({
      noteId: "note-2",
      title: "Aether Keep",
      attributes: [
        { attributeId: "attr-lore-note-2", name: "lore", value: "", type: "label" },
        { attributeId: "attr-type-note-2", name: "loreType", value: "location", type: "label" },
      ],
      content: "<h1>Aether Keep</h1><p>Fortress built above the ley breach.</p>",
    }),
  ];

  for (const note of seedNotes) {
    notes.set(note.noteId, structuredClone(note));
    orderedNoteIds.push(note.noteId);
  }

  await page.route("**/api/config/portal", async (route) => {
    await fulfillJson(route, { loreRootNoteId: "root" });
  });

  await page.route("**/api/rag", async (route) => {
    if (route.request().method() === "GET") {
      await fulfillJson(route, ragStatus);
      return;
    }

    await fulfillJson(route, { results: [] });
  });

  await page.route("**/api/lore/mention-search**", async (route) => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get("q") ?? "").replace(/^@+/, "").toLowerCase();
    const filtered = mentionSuggestions.filter((item) => item.title.toLowerCase().includes(query));
    await fulfillJson(route, filtered);
  });

  await page.route("**/api/lore/*/backlinks", async (route) => {
    await fulfillJson(route, []);
  });

  await page.route("**/api/lore/*/breadcrumbs", async (route) => {
    await fulfillJson(route, []);
  });

  await page.route("**/api/lore/*/relationships", async (route) => {
    await fulfillJson(route, { existing: [], suggestions: relationships.suggestions });
  });

  await page.route("**/api/lore/*/preview**", async (route) => {
    const note = findNoteFromUrl(route.request().url(), notes);
    await route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: note?.content ?? "",
    });
  });

  await page.route("**/api/lore/*/content", async (route) => {
    const note = findNoteFromUrl(route.request().url(), notes);

    if (route.request().method() === "PUT") {
      if (note) {
        note.content = await route.request().postData() ?? "";
        note.dateModified = new Date().toISOString();
      }
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fulfill({
      status: note ? 200 : 404,
      contentType: "text/html; charset=utf-8",
      body: note?.content ?? "",
    });
  });

  await page.route("**/api/lore/*", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const noteId = pathname.split("/").at(-1) ?? "";
    const note = notes.get(noteId);
    const method = route.request().method();

    if (
      pathname.endsWith("/api/lore") ||
      pathname.endsWith("/api/lore/mention-search")
    ) {
      await route.fallback();
      return;
    }

    if (method === "GET") {
      await fulfillJson(route, note ? serializeNote(note) : { error: "Not found" }, note ? 200 : 404);
      return;
    }

    if (method === "PATCH") {
      const body = route.request().postDataJSON() as { title?: string };
      if (note && body.title) {
        note.title = body.title;
        note.dateModified = new Date().toISOString();
      }
      await fulfillJson(route, note ? serializeNote(note) : { error: "Not found" }, note ? 200 : 404);
      return;
    }

    if (method === "DELETE") {
      if (note) {
        notes.delete(noteId);
        const index = orderedNoteIds.indexOf(noteId);
        if (index >= 0) orderedNoteIds.splice(index, 1);
      }
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/lore**", async (route) => {
    const request = route.request();
    const method = request.method();
    const pathname = new URL(request.url()).pathname;

    if (!pathname.endsWith("/api/lore")) {
      await route.fallback();
      return;
    }

    if (method === "GET") {
      const url = new URL(request.url());
      const q = url.searchParams.get("q") ?? "#lore";
      const result = filterNotes(q, orderedNoteIds.map((id) => notes.get(id)!).filter(Boolean));
      await fulfillJson(route, result.map(serializeNote));
      return;
    }

    if (method === "POST") {
      const body = request.postDataJSON() as {
        title: string;
        loreType?: string;
        content?: string;
        attributes?: Record<string, string>;
      };

      const noteId = `note-${orderedNoteIds.length + 1}`;
      const createdAt = new Date().toISOString();
      const attributes: Attribute[] = [
        { attributeId: `attr-lore-${noteId}`, name: "lore", value: "", type: "label" },
        { attributeId: `attr-type-${noteId}`, name: "loreType", value: body.loreType ?? "lore", type: "label" },
      ];

      for (const [key, value] of Object.entries(body.attributes ?? {})) {
        if (value.trim()) {
          attributes.push({
            attributeId: `attr-${key}-${noteId}`,
            name: key.replace(/\s+/g, "_"),
            value,
            type: "label",
          });
        }
      }

      const note: NoteRecord = {
        noteId,
        title: body.title,
        type: "text",
        dateCreated: createdAt,
        dateModified: createdAt,
        parentNoteIds: ["root"],
        attributes,
        content: body.content && body.content.trim() ? body.content : `<h1>${escapeHtml(body.title)}</h1><p>New lore entry.</p>`,
      };

      notes.set(noteId, note);
      orderedNoteIds.unshift(noteId);

      await fulfillJson(route, { note: { noteId } }, 201);
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/brain-dump/history**", async (route) => {
    await fulfillJson(route, []);
  });

  await page.route("**/api/brain-dump**", async (route) => {
    if (brainDump.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, brainDump.delayMs));
    }

    await fulfillJson(route, brainDump.body, brainDump.status ?? 200);
  });

  await page.route("**/api/ai/relationships", async (route) => {
    const method = route.request().method();
    if (method === "PUT") {
      await fulfillJson(route, { ok: true, applied: 1 });
      return;
    }

    await fulfillJson(route, { suggestions: relationships.suggestions });
  });

  await page.route("**/api/ai/gaps", async (route) => {
    await fulfillJson(route, gaps.body, gaps.status ?? 200);
  });

  await page.route("**/api/ai/consistency", async (route) => {
    await fulfillJson(route, { issues: [], summary: "" });
  });

  return {
    getNote(noteId: string) {
      return notes.get(noteId);
    },
    upsertNote(note: NoteRecord) {
      notes.set(note.noteId, structuredClone(note));
      if (!orderedNoteIds.includes(note.noteId)) {
        orderedNoteIds.unshift(note.noteId);
      }
    },
  };
}

function filterNotes(query: string, notes: NoteRecord[]) {
  const normalized = query.toLowerCase();

  return notes.filter((note) => {
    if (normalized.includes("#loretype=character")) {
      return note.attributes.some((attribute) => attribute.name === "loreType" && attribute.value === "character");
    }

    if (normalized === "#lore") {
      return note.attributes.some((attribute) => attribute.name === "lore");
    }

    return note.title.toLowerCase().includes(normalized.replace("#lore", "").trim());
  });
}

function serializeNote(note: NoteRecord) {
  return {
    noteId: note.noteId,
    title: note.title,
    type: note.type,
    dateCreated: note.dateCreated,
    dateModified: note.dateModified,
    attributes: note.attributes,
    parentNoteIds: note.parentNoteIds,
  };
}

function findNoteFromUrl(url: string, notes: Map<string, NoteRecord>) {
  const pathname = new URL(url).pathname;
  const segments = pathname.split("/");
  const loreIndex = segments.findIndex((segment) => segment === "lore");
  if (loreIndex === -1 || loreIndex + 1 >= segments.length) {
    return undefined;
  }

  return notes.get(segments[loreIndex + 1]);
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}