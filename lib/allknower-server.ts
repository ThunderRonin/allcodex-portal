/**
 * Server-only AllKnower API client.
 * Never import this in Client Components — used only in API routes.
 *
 * Auth: Bearer token passed explicitly — resolved from cookies or env by get-creds.ts.
 */

import { cookies } from "next/headers";
import { ServiceError } from "./route-error";
import {
  CopilotChatResponseSchema,
  type CopilotChatResponse,
  type CopilotRequest,
  ApplyRelationshipsResultSchema,
  BrainDumpAnyResultSchema,
  BrainDumpResultSchema,
  ConsistencyResultSchema,
  GapResultSchema,
  RelationshipsResultSchema,
  type ApplyRelationshipsResult,
  type ConsistencyResult,
  type GapResult,
  type RelationshipsResult,
} from "./allknower-schemas";

export interface AkCreds {
  url: string;
  token: string;
}

function buildJsonHeaders(initHeaders: HeadersInit | undefined, token?: string): HeadersInit {
  const headers = new Headers(initHeaders);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return headers;
}

async function akFetch(creds: AkCreds, path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${creds.url}${path}`, {
      ...init,
      headers: buildJsonHeaders(init.headers, creds.token),
    });
  } catch {
    throw new ServiceError("UNREACHABLE", 503, `AllKnower is unreachable at ${creds.url}`);
  }
  if (res.status === 401) {
    try {
      const jar = await cookies();
      jar.delete("allknower_token");
      jar.delete("allknower_url");
    } catch {}
    throw new ServiceError("UNAUTHORIZED", 401, "AllKnower session expired. Please sign in again.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower ${init.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res;
}

async function akPublicFetch(url: string, path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`${url}${path}`, {
      ...init,
      headers: buildJsonHeaders(init.headers),
    });
  } catch {
    throw new ServiceError("UNREACHABLE", 503, `AllKnower is unreachable at ${url}`);
  }
}

export async function loginAllKnower(
  url: string,
  email: string,
  password: string,
): Promise<{ token: string; user: unknown }> {
  const res = await akPublicFetch(url, "/api/auth/sign-in/email", {
    method: "POST",
    headers: { Origin: url },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ServiceError("UNAUTHORIZED", 401, `AllKnower login failed (${res.status})${body ? `: ${body}` : ""}`);
  }
  const token = res.headers.get("set-auth-token") ?? "";
  const data = await res.json().catch(() => ({}));
  if (!token) {
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower login did not return a session token.");
  }
  return { token, user: data.user ?? null };
}

export async function registerAllKnower(
  url: string,
  email: string,
  password: string,
  name: string,
): Promise<{ token: string; user: unknown }> {
  const res = await akPublicFetch(url, "/api/auth/sign-up/email", {
    method: "POST",
    headers: { Origin: url },
    body: JSON.stringify({ email, password, name }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower registration failed (${res.status})${body ? `: ${body}` : ""}`);
  }
  const token = res.headers.get("set-auth-token") ?? "";
  const data = await res.json().catch(() => ({}));
  if (!token) {
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower registration did not return a session token.");
  }
  return { token, user: data.user ?? null };
}

export async function getAllKnowerSession(creds: AkCreds): Promise<{ session: unknown; user: unknown }> {
  const res = await akFetch(creds, "/api/auth/get-session", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  return { session: data.session ?? null, user: data.user ?? null };
}

export async function logoutAllKnower(creds: AkCreds): Promise<void> {
  await akFetch(creds, "/api/auth/sign-out", { method: "POST", body: JSON.stringify({}) });
}

export interface AllCodexIntegrationStatus {
  connected: boolean;
  baseUrl?: string;
  tokenLast4?: string | null;
  updatedAt?: string;
}

export async function connectAllCodexIntegration(
  creds: AkCreds,
  baseUrl: string,
  token: string,
): Promise<AllCodexIntegrationStatus> {
  const res = await akFetch(creds, "/integrations/allcodex/connect", {
    method: "POST",
    body: JSON.stringify({ baseUrl, token }),
  });
  return res.json();
}

export async function getAllCodexIntegrationStatus(creds: AkCreds): Promise<AllCodexIntegrationStatus> {
  const res = await akFetch(creds, "/integrations/allcodex/status");
  return res.json();
}

export async function deleteAllCodexIntegration(creds: AkCreds): Promise<{ ok: boolean }> {
  const res = await akFetch(creds, "/integrations/allcodex", { method: "DELETE" });
  return res.json();
}

export async function resolveAllCodexCredentials(
  creds: AkCreds,
  portalInternalSecret: string,
): Promise<{ baseUrl: string; token: string }> {
  const res = await akFetch(creds, "/internal/integrations/allcodex/credentials", {
    method: "POST",
    headers: { "X-Portal-Internal-Secret": portalInternalSecret },
    body: JSON.stringify({}),
  });
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BrainDumpEntity {
  noteId: string;
  title: string;
  type: string;
}

export interface ProposedEntity {
  title: string;
  type: string;
  action: "create" | "update";
  content?: string;
  existingNoteId?: string;
}

export interface BrainDumpResult {
  mode?: "auto";
  summary: string;
  created: BrainDumpEntity[];
  updated: BrainDumpEntity[];
  skipped: Array<{ title: string; reason: string }>;
  duplicates?: Array<{
    proposedTitle: string;
    proposedType: string;
    matches: Array<{ noteId: string; title: string; score: number }>;
  }>;
}

export interface BrainDumpReviewResult {
  mode: "review";
  summary: string;
  proposedEntities: ProposedEntity[];
  duplicates?: Array<{
    proposedTitle: string;
    proposedType: string;
    matches: Array<{ noteId: string; title: string; score: number }>;
  }>;
}

export interface BrainDumpInboxResult {
  mode: "inbox";
  queued: true;
}

export type BrainDumpAnyResult = BrainDumpResult | BrainDumpReviewResult | BrainDumpInboxResult;

export interface BrainDumpHistoryEntry {
  id: string;
  rawText: string;
  summary: string | null;
  notesCreated: string[];
  notesUpdated: string[];
  model: string;
  tokensUsed: number | null;
  createdAt: string;
  entities: Array<{
    action: "created" | "updated";
    noteId: string;
    title: string;
    type: string;
  }> | null;
}

export interface BrainDumpDetailEntry extends BrainDumpHistoryEntry {
  parsedJson: {
    entities?: Array<{
      noteId: string;
      title: string;
      type: string;
      action: "created" | "updated";
    }>;
    summary?: string;
  } | null;
}

export interface RagChunk {
  noteId: string;
  noteTitle: string;
  content: string;
  score: number;
}

// ConsistencyIssue, ConsistencyResult, RelationshipSuggestion, GapArea, GapResult
// are now derived from Zod schemas in allknower-schemas.ts and re-exported from there.

// ── Brain Dump ────────────────────────────────────────────────────────────────

export async function runBrainDump(
  creds: AkCreds,
  rawText: string,
  mode: "auto" | "review" | "inbox" = "auto"
): Promise<BrainDumpAnyResult> {
  const res = await akFetch(creds, "/brain-dump", {
    method: "POST",
    body: JSON.stringify({ rawText, mode }),
    signal: AbortSignal.timeout(180_000),
  });
  const raw = await res.json();
  const parsed = BrainDumpAnyResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[runBrainDump] AllKnower schema mismatch:", parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function commitBrainDump(
  creds: AkCreds,
  rawText: string,
  approvedEntities: ProposedEntity[]
): Promise<BrainDumpResult> {
  const res = await akFetch(creds, "/brain-dump/commit", {
    method: "POST",
    body: JSON.stringify({ rawText, approvedEntities }),
    signal: AbortSignal.timeout(180_000),
  });
  const raw = await res.json();
  const parsed = BrainDumpResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[commitBrainDump] AllKnower schema mismatch:", parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function getBrainDumpHistory(
  creds: AkCreds,
  cursor?: string,
): Promise<{ items: BrainDumpHistoryEntry[]; nextCursor?: string; hasMore: boolean }> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  const res = await akFetch(creds, `/brain-dump/history${qs ? `?${qs}` : ""}`);
  const data = await res.json();
  const items = data.items ?? (Array.isArray(data) ? data : []);
  return { items, nextCursor: data.nextCursor, hasMore: !!data.nextCursor };
}

export async function getBrainDumpEntry(creds: AkCreds, id: string): Promise<BrainDumpDetailEntry> {
  const res = await akFetch(creds, `/brain-dump/history/${encodeURIComponent(id)}`);
  return res.json();
}

// ── RAG ───────────────────────────────────────────────────────────────────────

export async function queryRag(creds: AkCreds, text: string, topK = 10): Promise<RagChunk[]> {
  const res = await akFetch(creds, "/rag/query", {
    method: "POST",
    body: JSON.stringify({ text, topK }),
  });
  const data = await res.json();
  return data.results ?? [];
}

export async function runArticleCopilot(
  creds: AkCreds,
  payload: CopilotRequest,
): Promise<CopilotChatResponse> {
  const res = await akFetch(creds, "/copilot/article", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await res.json();
  const parsed = CopilotChatResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[runArticleCopilot] AllKnower schema mismatch:`, parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function getRagStatus(creds: AkCreds): Promise<{ indexedNotes: number; lastIndexed: string | null; model: string | null }> {
  const res = await akFetch(creds, "/rag/status");
  return res.json();
}

export async function triggerReindex(creds: AkCreds, noteId?: string): Promise<{ ok: boolean }> {
  if (noteId) {
    const res = await akFetch(creds, `/rag/reindex/${noteId}`, { method: "POST" });
    return res.json();
  }
  const res = await akFetch(creds, "/rag/reindex", { method: "POST" });
  return res.json();
}

// ── Intelligence ──────────────────────────────────────────────────────────────

export async function checkConsistency(creds: AkCreds, noteIds?: string[]): Promise<ConsistencyResult> {
  const res = await akFetch(creds, "/consistency/check", {
    method: "POST",
    body: JSON.stringify({ noteIds }),
    signal: AbortSignal.timeout(180_000),
  });
  const raw = await res.json();
  const parsed = ConsistencyResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[checkConsistency] AllKnower schema mismatch:`, parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function suggestRelationships(creds: AkCreds, text: string, noteId?: string): Promise<RelationshipsResult> {
  const res = await akFetch(creds, "/suggest/relationships", {
    method: "POST",
    body: JSON.stringify({ text, ...(noteId ? { noteId } : {}) }),
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await res.json();
  const parsed = RelationshipsResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[suggestRelationships] AllKnower schema mismatch:`, parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function akFetchAutocomplete(creds: AkCreds, q: string): Promise<any[]> {
  const res = await akFetch(creds, `/suggest/autocomplete?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.suggestions ?? [];
}

export async function applyRelationships(
  creds: AkCreds,
  sourceNoteId: string,
  relations: Array<{ targetNoteId: string; relationshipType: string; description?: string }>,
  bidirectional = true
): Promise<ApplyRelationshipsResult> {
  const res = await akFetch(creds, "/suggest/relationships/apply", {
    method: "POST",
    body: JSON.stringify({ sourceNoteId, relations, bidirectional }),
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await res.json();
  const parsed = ApplyRelationshipsResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[applyRelationships] AllKnower schema mismatch:`, parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function getGaps(creds: AkCreds): Promise<GapResult> {
  const res = await akFetch(creds, "/suggest/gaps", {
    method: "POST",
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await res.json();
  const parsed = GapResultSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`[getGaps] AllKnower schema mismatch:`, parsed.error.message);
    throw new ServiceError("SERVICE_ERROR", 502, "AllKnower returned an unexpected response format.");
  }
  return parsed.data;
}

export async function getHealth(creds: AkCreds): Promise<{ status: string; allcodex: string; ollama: string }> {
  const res = await akFetch(creds, "/health");
  return res.json();
}
