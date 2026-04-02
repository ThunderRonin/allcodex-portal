"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Brain,
  Clock,
  BookOpen,
  Plus,
  Pencil,
  Cpu,
  Zap,
} from "lucide-react";
import Link from "next/link";

interface BrainDumpDetailEntry {
  id: string;
  rawText: string;
  summary: string | null;
  notesCreated: string[];
  notesUpdated: string[];
  model: string;
  tokensUsed: number | null;
  createdAt: string;
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

export default function BrainDumpDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: entry, isLoading, error } = useQuery<BrainDumpDetailEntry>({
    queryKey: ["brain-dump-entry", id],
    queryFn: async () => {
      const r = await fetch(`/api/brain-dump/history/${id}`);
      if (!r.ok) throw await r.json();
      return r.json();
    },
  });

  const entities = entry?.parsedJson?.entities ?? [];
  const summary = entry?.summary ?? entry?.parsedJson?.summary ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
        <Link href="/brain-dump">
          <ArrowLeft className="h-4 w-4" />
          Brain Dump
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold text-primary"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          Brain Dump Detail
        </h1>
        {isLoading ? (
          <Skeleton className="h-4 w-40 mt-1" />
        ) : entry ? (
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(entry.createdAt).toLocaleString()}
            </span>
            {entry.model && (
              <span className="flex items-center gap-1">
                <Cpu className="h-3 w-3" />
                {entry.model}
              </span>
            )}
            {entry.tokensUsed && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {entry.tokensUsed.toLocaleString()} tokens
              </span>
            )}
          </p>
        ) : null}
      </div>

      {error && (
        <p className="text-sm text-red-400 rounded-md bg-red-500/10 border border-red-500/20 p-3">
          Failed to load entry.
        </p>
      )}

      {/* Stats */}
      {!isLoading && entry && (
        <div className="flex gap-6">
          <div className="text-center">
            <div
              className="text-2xl font-bold text-primary"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              {entry.notesCreated.length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Plus className="h-3 w-3" /> Created
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold text-primary"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              {entry.notesUpdated.length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Updated
            </div>
          </div>
        </div>
      )}

      {/* Raw text */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
            Raw Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            <blockquote className="border-l-2 border-border/50 pl-4 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {entry?.rawText}
            </blockquote>
          )}
        </CardContent>
      </Card>

      {/* AI Summary */}
      {(isLoading || summary) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle
              className="text-sm text-primary flex items-center gap-2"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              <Brain className="h-4 w-4" />
              AllKnower Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-4 w-3/4" />
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                {summary}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Entity cards */}
      {(isLoading || entities.length > 0) && (
        <div>
          <h2
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            Entries Affected
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {entities.map((e) => (
                <Link
                  key={e.noteId}
                  href={`/lore/${e.noteId}`}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 p-3 hover:border-primary/40 hover:bg-card/70 transition-colors"
                >
                  <div className="p-2 rounded-md bg-primary/10 shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{e.type}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${
                      e.action === "created"
                        ? "text-green-400 border-green-500/40"
                        : "text-yellow-400 border-yellow-500/40"
                    }`}
                  >
                    {e.action}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
