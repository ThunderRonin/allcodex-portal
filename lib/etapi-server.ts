/**
 * Server-only ETAPI client for AllCodex (Trilium).
 * Never import this in Client Components — used only in API routes and Server Components.
 *
 * Auth: HTTP Basic auth with the ETAPI token as the username and an empty password.
 * Credentials are passed explicitly — resolved from cookies or env by get-creds.ts.
 */

import { ServiceError } from "./route-error";

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

export interface CreateNoteParams {
  parentNoteId: string;
  title: string;
  type?: "text" | "code" | "file" | "image" | "search" | "book" | "noteMap" | "webView";
  mime?: string;
  content?: string;
  notePosition?: number;
  noteId?: string;
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
export async function createNote(creds: EtapiCreds, params: CreateNoteParams): Promise<EtapiNote & { branch: unknown }> {
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
    headers: { "Content-Type": "text/html" },
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

/** Get app info */
export async function getAppInfo(creds: EtapiCreds): Promise<EtapiAppInfo> {
  const res = await etapiFetch(creds, "/app-info");
  return res.json();
}
