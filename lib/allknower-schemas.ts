import { z } from "zod";

export const ConsistencyIssueSchema = z.object({
  type: z.enum(["contradiction", "timeline", "orphan", "naming", "logic", "power"]),
  severity: z.enum(["high", "medium", "low"]),
  description: z.string(),
  affectedNoteIds: z.array(z.string()),
});

export const ConsistencyResultSchema = z.object({
  issues: z.array(ConsistencyIssueSchema),
  summary: z.string(),
});

export const GapAreaSchema = z.object({
  area: z.string(),
  severity: z.enum(["high", "medium", "low"]),
  description: z.string(),
  suggestion: z.string(),
});

export const GapResultSchema = z.object({
  gaps: z.array(GapAreaSchema),
  summary: z.string(),
  typeCounts: z.record(z.string(), z.number()).optional(),
  totalNotes: z.number().optional(),
});

export const RelationshipSuggestionSchema = z.object({
  targetNoteId: z.string(),
  targetTitle: z.string().optional(),
  relationshipType: z.enum(["ally", "enemy", "rival", "family", "member_of", "leader_of", "serves", "located_in", "originates_from", "participated_in", "caused", "created", "owns", "wields", "worships", "inhabits", "related_to"]),
  description: z.string(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

export const RelationshipsResultSchema = z.object({
  suggestions: z.array(RelationshipSuggestionSchema),
});

export const BrainDumpEntitySchema = z.object({
  noteId: z.string(),
  title: z.string(),
  type: z.string(),
});

export const BrainDumpResultSchema = z
  .object({
    summary: z.string(),
    created: z.array(BrainDumpEntitySchema),
    updated: z.array(BrainDumpEntitySchema),
    skipped: z.array(z.object({ title: z.string(), reason: z.string() })),
  })
  .passthrough();

export const BrainDumpReviewResultSchema = z.object({
  mode: z.literal("review"),
  summary: z.string(),
  proposedEntities: z.array(
    z.object({
      title: z.string(),
      type: z.string(),
      action: z.enum(["create", "update"]),
      content: z.string().optional(),
      existingNoteId: z.string().optional(),
    })
  ),
}).passthrough();

// Derived TypeScript types — replace manual interfaces in allknower-server.ts
export type ConsistencyResult = z.infer<typeof ConsistencyResultSchema>;
export type GapResult = z.infer<typeof GapResultSchema>;
export type RelationshipSuggestion = z.infer<typeof RelationshipSuggestionSchema>;
export type RelationshipsResult = z.infer<typeof RelationshipsResultSchema>;
export type BrainDumpResult = z.infer<typeof BrainDumpResultSchema>;
export type BrainDumpReviewResult = z.infer<typeof BrainDumpReviewResultSchema>;
