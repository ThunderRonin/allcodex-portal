"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Network, ChevronDown, ChevronUp, Loader2, Check, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MermaidDiagram } from "./MermaidDiagram";

// ── Relationship type → edge color mapping ────────────────────────────────────

const EDGE_COLORS: Record<string, string> = {
  ally: "#4ade80",
  enemy: "#ef4444",
  rival: "#f97316",
  family: "#ec4899",
  member_of: "#a78bfa",
  leader_of: "#c084fc",
  serves: "#818cf8",
  located_in: "#38bdf8",
  originates_from: "#22d3ee",
  participated_in: "#fbbf24",
  caused: "#f59e0b",
  created: "#34d399",
  owns: "#fb923c",
  wields: "#e879f9",
  worships: "#c4b5fd",
  inhabits: "#67e8f9",
  related_to: "#94a3b8",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExistingRelation {
  name: string;
  targetNoteId: string;
  targetTitle: string;
}

interface Suggestion {
  targetNoteId: string;
  targetTitle: string;
  relationshipType: string;
  description: string;
}

interface RelationshipsResponse {
  existing: ExistingRelation[];
  suggestions: Suggestion[];
}

interface Edge {
  targetId: string;
  targetTitle: string;
  type: string;
  source: "existing" | "ai";
}

// ── Mermaid DSL builder ───────────────────────────────────────────────────────

function sanitizeLabel(text: string): string {
  return text
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\[/g, "&#91;")
    .replace(/]/g, "&#93;")
    .replace(/\(/g, "&#40;")
    .replace(/\)/g, "&#41;")
    .replace(/\{/g, "&#123;")
    .replace(/}/g, "&#125;")
    .replace(/\|/g, "&#124;");
}

function buildMermaidDSL(
  centerTitle: string,
  centerId: string,
  edges: Edge[]
): string {
  if (edges.length === 0) return "";

  const lines: string[] = ["graph LR"];

  // Center node with special styling
  lines.push(`  center["${sanitizeLabel(centerTitle)}"]`);
  lines.push(`  style center fill:#6b4c2a,stroke:#d4a843,stroke-width:2px,color:#e8dcc8`);

  // Deduplicate edges by targetId (prefer existing over AI)
  const seen = new Map<string, Edge>();
  for (const edge of edges) {
    const existing = seen.get(edge.targetId);
    if (!existing || (edge.source === "existing" && existing.source === "ai")) {
      seen.set(edge.targetId, edge);
    }
  }

  const uniqueEdges = Array.from(seen.values());
  const edgeStyleIndices: { idx: number; color: string }[] = [];

  uniqueEdges.forEach((edge, i) => {
    const nodeKey = `n${i}`;
    const label = sanitizeLabel(edge.targetTitle);
    const typeLabel = edge.type.replace(/_/g, " ");
    const isDashed = edge.source === "ai";

    lines.push(`  ${nodeKey}["${label}"]`);

    if (isDashed) {
      lines.push(`  center -.->|${typeLabel}| ${nodeKey}`);
    } else {
      lines.push(`  center -->|${typeLabel}| ${nodeKey}`);
    }

    // Style AI-suggested nodes slightly differently
    if (isDashed) {
      lines.push(`  style ${nodeKey} fill:#1a1528,stroke:#555,stroke-dasharray:5 5,color:#d4c9a8`);
    } else {
      lines.push(`  style ${nodeKey} fill:#1a1528,stroke:#8b6914,color:#e8dcc8`);
    }

    // Track edge color
    const color = EDGE_COLORS[edge.type] ?? EDGE_COLORS.related_to;
    edgeStyleIndices.push({ idx: i, color });

    // Click handler → navigate to lore entry
    lines.push(`  click ${nodeKey} "/lore/${edge.targetId}"`);
  });

  // Apply edge colors via linkStyle
  for (const { idx, color } of edgeStyleIndices) {
    lines.push(`  linkStyle ${idx} stroke:${color},stroke-width:2px`);
  }

  return lines.join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

interface RelationshipGraphProps {
  /** The note ID to fetch relationships for */
  noteId: string;
  /** The note title (used as center node label) */
  noteTitle: string;
}

export function RelationshipGraph({ noteId, noteTitle }: RelationshipGraphProps) {
  const [expanded, setExpanded] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<RelationshipsResponse>({
    queryKey: ["relationships", noteId],
    queryFn: () =>
      fetch(`/api/lore/${noteId}/relationships`, { method: "POST" }).then(
        (r) => {
          if (!r.ok) throw new Error(`Failed to load relationships`);
          return r.json();
        }
      ),
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { mutate: applyRelation, variables: applyingKey } = useMutation({
    mutationFn: async ({ suggestion }: { suggestion: Suggestion; key: string }) => {
      const r = await fetch("/api/ai/relationships", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceNoteId: noteId,
          relations: [{
            targetNoteId: suggestion.targetNoteId,
            relationshipType: suggestion.relationshipType,
            description: suggestion.description,
          }],
          bidirectional: true,
        }),
      });
      if (!r.ok) throw new Error("Failed to apply relation");
      return r.json();
    },
    onSuccess: (_, { key }) => {
      setApplied((prev) => new Set(prev).add(key));
      // Invalidate the note query so the sidebar relations section refreshes
      queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
  });

  // Build edges from the response
  const edges: Edge[] = [];
  if (data) {
    for (const rel of data.existing) {
      edges.push({
        targetId: rel.targetNoteId,
        targetTitle: rel.targetTitle,
        type: rel.name,
        source: "existing",
      });
    }
    for (const sug of data.suggestions) {
      edges.push({
        targetId: sug.targetNoteId,
        targetTitle: sug.targetTitle,
        type: sug.relationshipType,
        source: "ai",
      });
    }
  }

  const chart = edges.length > 0 ? buildMermaidDSL(noteTitle, noteId, edges) : "";

  const handleNodeClick = (nodeId: string) => {
    router.push(`/lore/${nodeId}`);
  };

  const aiSuggestions = data?.suggestions ?? [];

  return (
    <Card className="border-primary/20 bg-card/60">
      <CardHeader className="pb-2 border-b border-border/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left cursor-pointer"
        >
          <CardTitle
            className="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            <Network className="h-3.5 w-3.5" />
            Relationship Map
          </CardTitle>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-3 space-y-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing relationships...
            </div>
          )}

          {error && (
            <div className="space-y-2 py-2">
              <p className="text-sm text-destructive/80">
                Failed to load relationships.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {data && edges.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-2">
              No relationships found for this entry.
            </p>
          )}

          {/* Diagram */}
          {chart && (
            <div className="space-y-2">
              <MermaidDiagram
                chart={chart}
                onNodeClick={handleNodeClick}
                className="rounded-md border border-border/30 bg-background/50 p-2"
              />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-0.5 bg-primary" />
                  Existing
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-0.5 border-t border-dashed border-muted-foreground" />
                  AI Suggested
                </span>
              </div>
            </div>
          )}

          {/* AI suggestions list with Apply buttons */}
          {aiSuggestions.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] uppercase tracking-wider text-muted-foreground"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                AI Suggestions
              </p>
              {aiSuggestions.map((s) => {
                const key = `${s.targetNoteId}::${s.relationshipType}`;
                const isApplied = applied.has(key);
                const isApplying = applyingKey?.key === key;
                return (
                  <div
                    key={key}
                    className="flex items-start gap-2 rounded-md border border-border/40 bg-background/40 p-2.5"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize px-1.5 py-0"
                        >
                          {s.relationshipType.replace(/_/g, " ")}
                        </Badge>
                        <Link
                          href={`/lore/${s.targetNoteId}`}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5"
                        >
                          {s.targetTitle}
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {s.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isApplied ? "secondary" : "outline"}
                      className="shrink-0 h-7 px-2 gap-1 text-xs"
                      disabled={isApplied || isApplying}
                      onClick={() => applyRelation({ suggestion: s, key })}
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3 w-3" />
                          Applied
                        </>
                      ) : isApplying ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Apply
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
