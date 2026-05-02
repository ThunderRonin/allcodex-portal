/**
 * Server-only AllKnower API client.
 * Never import this in Client Components — used only in API routes.
 *
 * Auth: Bearer token passed explicitly — resolved from cookies or env by get-creds.ts.
 */

import { ServiceError } from "./route-error";
import {
  CopilotChatResponseSchema,
  type CopilotChatResponse,
  type CopilotRequest,
  ConsistencyResultSchema,
  GapResultSchema,
  RelationshipsResultSchema,
  type ConsistencyResult,
  type GapResult,
  type RelationshipsResult,
} from "./allknower-schemas";

export interface AkCreds {
  url: string;
  token: string;
}

async function akFetch(creds: AkCreds, path: string, init: RequestInit = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${creds.url}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ServiceError("UNREACHABLE", 503, `AllKnower is unreachable at ${creds.url}`);
  }
  if (res.status === 401) {
    throw new ServiceError("UNAUTHORIZED", 401, "AllKnower credentials are invalid. Go to Settings to reconnect.");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower ${init.method ?? "GET"} ${path} → ${res.status}: ${body}`);
  }
  return res;
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
  });
  return res.json();
}

export async function commitBrainDump(
  creds: AkCreds,
  rawText: string,
  approvedEntities: ProposedEntity[]
): Promise<BrainDumpResult> {
  const res = await akFetch(creds, "/brain-dump/commit", {
    method: "POST",
    body: JSON.stringify({ rawText, approvedEntities }),
  });
  return res.json();
}

export async function getBrainDumpHistory(creds: AkCreds): Promise<BrainDumpHistoryEntry[]> {
  const res = await akFetch(creds, "/brain-dump/history");
  const data = await res.json();
  return data.items ?? data;
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
  });
  const raw = await res.json();
  const parsed = CopilotChatResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower /copilot/article returned unexpected shape: ${parsed.error.message}`);
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
  });
  const raw = await res.json();
  const parsed = ConsistencyResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower /consistency/check returned unexpected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function suggestRelationships(creds: AkCreds, text: string, noteId?: string): Promise<RelationshipsResult> {
  const res = await akFetch(creds, "/suggest/relationships", {
    method: "POST",
    body: JSON.stringify({ text, ...(noteId ? { noteId } : {}) }),
  });
  const raw = await res.json();
  const parsed = RelationshipsResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower /suggest/relationships returned unexpected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function akFetchAutocomplete(creds: AkCreds, q: string): Promise<any[]> {
  const res = await akFetch(creds, `/suggest/autocomplete?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  return data.suggestions ?? [];
}

export interface ApplyRelationsResult {
  applied: number;
  skipped: number;
  errors: string[];
}

export async function applyRelationships(
  creds: AkCreds,
  sourceNoteId: string,
  relations: Array<{ targetNoteId: string; relationshipType: string; description?: string }>,
  bidirectional = true
): Promise<ApplyRelationsResult> {
  const res = await akFetch(creds, "/suggest/relationships/apply", {
    method: "POST",
    body: JSON.stringify({ sourceNoteId, relations, bidirectional }),
  });
  return res.json();
}

export async function getGaps(creds: AkCreds): Promise<GapResult> {
  const res = await akFetch(creds, "/suggest/gaps");
  const raw = await res.json();
  const parsed = GapResultSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ServiceError("SERVICE_ERROR", 502, `AllKnower /suggest/gaps returned unexpected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function getHealth(creds: AkCreds): Promise<{ status: string; allcodex: string; ollama: string }> {
  const res = await akFetch(creds, "/health");
  return res.json();
}
