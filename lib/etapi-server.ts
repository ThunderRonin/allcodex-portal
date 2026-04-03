/**
 * Server-only ETAPI client for AllCodex (Trilium).
 * Never import this in Client Components — used only in API routes and Server Components.
 *
 * Auth: HTTP Basic auth with the ETAPI token as the username and an empty password.
 * Credentials are passed explicitly — resolved from cookies or env by get-creds.ts.
 */

import { ServiceError } from "./route-error";
import { isPortraitRelationName } from "./lore-presentation";

export interface EtapiCreds {
  url: string;
  token: string;
}

function makeAuthHeader(token: string) {
  return token; // Trilium accepts the raw ETAPI token directly in Authorization header
}

async function etapiFetch(creds: EtapiCreds, path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${creds.url}/etapi${path}`, {
      ...init,
      headers: {
        Authorization: makeAuthHeader(creds.token),
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ServiceError("UNREACHABLE", 503, `AllCodex is unreachable at ${creds.url}`);
  }
  if (res.status === 401) {
    throw new ServiceError("UNAUTHORIZED", 401, "AllCodex credentials are invalid. Go to Settings to reconnect.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ServiceError("SERVICE_ERROR", 502, `ETAPI ${init.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EtapiAttribute {
  attributeId: string;
  noteId: string;
  type: "label" | "relation";
  name: string;
  value: string;
  isInheritable: boolean;
}

export interface EtapiNote {
  noteId: string;
  title: string;
  type: string;
  mime: string;
  isProtected: boolean;
  dateCreated: string;
  dateModified: string;
  utcDateModified: string;
  parentNoteIds: string[];
  childNoteIds: string[];
  parentBranchIds: string[];
  childBranchIds: string[];
  attributes: EtapiAttribute[];
}

export interface ResolvedRelation {
  name: string;
  targetNoteId: string;
  targetTitle: string;
  loreType: string | null;
}

export interface CreateNoteParams {
  parentNoteId: string;
  title: string;
  type?: "text" | "code" | "file" | "image" | "search" | "book" | "noteMap" | "webView";
  mime?: string;
  content?: string;
  notePosition?: number;
  noteId?: string;
}

export interface CreateNoteResponse {
  note: EtapiNote;
  branch: unknown;
}

export interface EtapiAppInfo {
  appVersion: string;
  dbVersion: number;
  syncVersion: number;
  buildDate: string;
  buildRevision: string;
  dataDirectory: string;
  clipperProtocolVersion: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

/** Search for notes using Trilium search syntax, e.g. "#template #lore" */
export async function searchNotes(creds: EtapiCreds, query: string): Promise<EtapiNote[]> {
  const res = await etapiFetch(creds, `/notes?search=${encodeURIComponent(query)}&limit=200`);
  const data = await res.json();
  return data.results ?? [];
}

/** Quick title search for mention autocomplete (slim response) */
export async function searchNotesTitles(
  creds: EtapiCreds,
  query: string,
  limit = 8
): Promise<{ noteId: string; title: string; loreType?: string }[]> {
  const res = await etapiFetch(creds, `/notes?search=${encodeURIComponent(query)}&limit=${limit}`);
  const data = await res.json();
  const notes = data.results ?? [];
  return notes.map((note: EtapiNote) => ({
    noteId: note.noteId,
    title: note.title,
    loreType: note.attributes.find((a) => a.name === "loreType")?.value,
  }));
}

/** Get a single note by ID */
export async function getNote(creds: EtapiCreds, noteId: string): Promise<EtapiNote> {
  const res = await etapiFetch(creds, `/notes/${noteId}`);
  return res.json();
}

/** Get note HTML content */
export async function getNoteContent(creds: EtapiCreds, noteId: string): Promise<string> {
  const res = await etapiFetch(creds, `/notes/${noteId}/content`);
  return res.text();
}

/** Create a new note */
export async function createNote(creds: EtapiCreds, params: CreateNoteParams): Promise<CreateNoteResponse> {
  const res = await etapiFetch(creds, "/create-note", {
    method: "POST",
    body: JSON.stringify({ type: "text", ...params }),
  });
  return res.json();
}

/** Update note metadata (title) */
export async function patchNote(creds: EtapiCreds, noteId: string, patch: { title?: string }): Promise<EtapiNote> {
  const res = await etapiFetch(creds, `/notes/${noteId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return res.json();
}

/** Update note content */
export async function putNoteContent(creds: EtapiCreds, noteId: string, html: string): Promise<void> {
  await etapiFetch(creds, `/notes/${noteId}/content`, {
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body: html,
  });
}

/** Delete a note */
export async function deleteNote(creds: EtapiCreds, noteId: string): Promise<void> {
  await etapiFetch(creds, `/notes/${noteId}`, { method: "DELETE" });
}

/** Create an attribute (label or relation) on a note */
export async function createAttribute(creds: EtapiCreds, params: {
  noteId: string;
  type: "label" | "relation";
  name: string;
  value: string;
  isInheritable?: boolean;
}): Promise<EtapiAttribute> {
  const res = await etapiFetch(creds, "/attributes", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.json();
}

/** Delete an attribute */
export async function deleteAttribute(creds: EtapiCreds, attributeId: string): Promise<void> {
  await etapiFetch(creds, `/attributes/${attributeId}`, { method: "DELETE" });
}

/** Create a new branch link */
export async function createBranch(creds: EtapiCreds, params: {
  noteId: string;
  parentNoteId: string;
  notePosition?: number;
}): Promise<any> {
  const res = await etapiFetch(creds, "/branches", {
    method: "POST",
    body: JSON.stringify(params),
  });
  return res.json();
}

/** Get a specific branch */
export async function getBranch(creds: EtapiCreds, branchId: string): Promise<any> {
  const res = await etapiFetch(creds, `/branches/${branchId}`);
  return res.json();
}

/** Delete a branch */
export async function deleteBranch(creds: EtapiCreds, branchId: string): Promise<void> {
  await etapiFetch(creds, `/branches/${branchId}`, { method: "DELETE" });
}

/** Patch a branch */
export async function patchBranch(creds: EtapiCreds, branchId: string, patch: {
  notePosition?: number;
  prefix?: string;
}): Promise<any> {
  const res = await etapiFetch(creds, `/branches/${branchId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return res.json();
}

/** Refresh ordering of children for a specific parent */
export async function refreshNoteOrdering(creds: EtapiCreds, parentNoteId: string): Promise<void> {
  await etapiFetch(creds, `/refresh-note-ordering/${parentNoteId}`, { method: "POST" });
}

/** Walk parentNoteIds to build breadcrumb ancestry (root → immediate parent). */
export async function getNoteAncestors(
  creds: EtapiCreds,
  noteId: string,
  maxDepth = 8,
): Promise<Array<{ noteId: string; title: string }>> {
  const ancestors: Array<{ noteId: string; title: string }> = [];
  const visited = new Set<string>([noteId]);
  let currentId = noteId;

  for (let i = 0; i < maxDepth; i++) {
    const note = await getNote(creds, currentId).catch(() => null);
    if (!note) break;
    const parentId = note.parentNoteIds?.[0];
    if (!parentId || parentId === "root" || visited.has(parentId)) break;
    visited.add(parentId);
    const parent = await getNote(creds, parentId).catch(() => null);
    if (!parent) break;
    ancestors.unshift({ noteId: parentId, title: parent.title });
    currentId = parentId;
  }
  return ancestors;
}

/** Search for notes that have any relation pointing TO the given noteId. */
export async function searchBacklinks(
  creds: EtapiCreds,
  noteId: string,
): Promise<Array<{ noteId: string; title: string; loreType: string | null }>> {
  try {
    // Trilium search: ~*=X finds notes with any relation whose target matches X.
    // AllCodex may match by noteId or title depending on build version.
    const res = await etapiFetch(
      creds,
      `/notes?search=${encodeURIComponent(`~* ="${noteId}"`)}&limit=50`,
    );
    const data = await res.json();
    const notes: EtapiNote[] = data.results ?? [];
    return notes.map((n) => ({
      noteId: n.noteId,
      title: n.title,
      loreType: n.attributes?.find((a) => a.name === "loreType")?.value ?? null,
    }));
  } catch {
    return [];
  }
}

export function getPortraitImageNoteId(note: EtapiNote): string | null {
  const portraitRelation = note.attributes?.find(
    (attr) => attr.type === "relation" && isPortraitRelationName(attr.name),
  );
  return portraitRelation?.value ?? null;
}

export async function resolveNoteRelations(
  creds: EtapiCreds,
  note: EtapiNote,
): Promise<ResolvedRelation[]> {
  const relations = (note.attributes ?? []).filter(
    (attr) =>
      attr.type === "relation" &&
      attr.name !== "template" &&
      !isPortraitRelationName(attr.name),
  );

  const resolved = await Promise.all(
    relations.map(async (relation) => {
      try {
        const target = await getNote(creds, relation.value);
        return {
          name: relation.name,
          targetNoteId: relation.value,
          targetTitle: target.title,
          loreType: target.attributes?.find((attr) => attr.name === "loreType")?.value ?? null,
        } satisfies ResolvedRelation;
      } catch {
        return {
          name: relation.name,
          targetNoteId: relation.value,
          targetTitle: relation.value,
          loreType: null,
        } satisfies ResolvedRelation;
      }
    }),
  );

  return resolved;
}

/** Get app info */
export async function getAppInfo(creds: EtapiCreds): Promise<EtapiAppInfo> {
  const res = await etapiFetch(creds, "/app-info");
  return res.json();
}
