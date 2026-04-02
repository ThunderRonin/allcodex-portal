"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface QuestNote {
  noteId: string;
  title: string;
  attributes: Array<{ name: string; value: string; type: string }>;
}

type QuestStatus = "active" | "complete" | "failed" | "all";

function getAttr(note: QuestNote, name: string): string | undefined {
  return note.attributes.find((a) => a.name === name)?.value;
}

function statusBadgeVariant(status: string) {
  switch (status?.toLowerCase()) {
    case "active":
      return "default";
    case "complete":
      return "secondary";
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

function QuestCard({ note }: { note: QuestNote }) {
  const status = getAttr(note, "questStatus") ?? getAttr(note, "status") ?? "unknown";
  const description = getAttr(note, "description") ?? getAttr(note, "summary");
  const location = getAttr(note, "location");
  const linkedNotes = note.attributes
    .filter((a) => a.type === "relation")
    .slice(0, 4);

  return (
    <Card className="border-border/50 bg-card/60 hover:bg-card/80 transition-colors">
      <CardHeader className="px-4 py-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/lore/${note.noteId}`}
              className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1 group"
            >
              {note.title}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
            </Link>
            {location && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <MapPin className="inline h-3 w-3 mr-0.5" />
                {location}
              </p>
            )}
          </div>
          <Badge variant={statusBadgeVariant(status)} className="text-[11px] shrink-0 capitalize">
            {status}
          </Badge>
        </div>
      </CardHeader>
      {(description || linkedNotes.length > 0) && (
        <CardContent className="px-4 py-0 pb-3 space-y-2">
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{description}</p>
          )}
          {linkedNotes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {linkedNotes.map((a) => (
                <Link
                  key={`${a.name}-${a.value}`}
                  href={`/lore/${a.value}`}
                  className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary px-1.5 py-0.5 rounded border border-primary/20 hover:border-primary/40 transition-colors"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function QuestsPage() {
  const [activeTab, setActiveTab] = useState<QuestStatus>("all");

  const { data: quests, isLoading, isError } = useQuery<QuestNote[]>({
    queryKey: ["quests"],
    queryFn: () => fetch("/api/quests").then((r) => r.json()),
    staleTime: 30_000,
  });

  const filtered = (quests ?? []).filter((q) => {
    if (activeTab === "all") return true;
    const status = getAttr(q, "questStatus") ?? getAttr(q, "status") ?? "unknown";
    return status.toLowerCase() === activeTab;
  });

  const counts = (quests ?? []).reduce(
    (acc, q) => {
      const s = (getAttr(q, "questStatus") ?? getAttr(q, "status") ?? "unknown").toLowerCase();
      if (s === "active") acc.active++;
      else if (s === "complete") acc.complete++;
      else if (s === "failed") acc.failed++;
      return acc;
    },
    { active: 0, complete: 0, failed: 0 }
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 shrink-0">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="font-bold text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
          Quests &amp; Hooks
        </h1>
        {quests && (
          <Badge variant="outline" className="ml-auto text-xs">
            {quests.length} total
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-6 py-3 border-b border-border/30 shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QuestStatus)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 h-7">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-3 h-7">
              Active {counts.active > 0 && `(${counts.active})`}
            </TabsTrigger>
            <TabsTrigger value="complete" className="text-xs px-3 h-7">
              Complete {counts.complete > 0 && `(${counts.complete})`}
            </TabsTrigger>
            <TabsTrigger value="failed" className="text-xs px-3 h-7">
              Failed {counts.failed > 0 && `(${counts.failed})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading quests…
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center py-20 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed to load quests. Check your AllCodex connection in Settings.
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {quests?.length === 0
                  ? "No quest notes found. Create notes with the #quest label in AllCodex."
                  : `No ${activeTab} quests.`}
              </p>
            </div>
          )}
          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((q) => (
                <QuestCard key={q.noteId} note={q} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
