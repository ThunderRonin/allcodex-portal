"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, ExternalLink, Loader2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

interface TimelineNote {
  noteId: string;
  title: string;
  attributes: Array<{ name: string; value: string; type: string }>;
}

function getAttr(note: TimelineNote, name: string): string | undefined {
  return note.attributes.find((a) => a.name === name)?.value;
}

function loreTypeBadgeColor(type: string | undefined) {
  switch (type) {
    case "event":
      return "bg-amber-900/30 text-amber-300 border-amber-700/40";
    case "timeline":
      return "bg-blue-900/30 text-blue-300 border-blue-700/40";
    default:
      return "bg-muted text-muted-foreground border-border/40";
  }
}

function EventCard({ note }: { note: TimelineNote }) {
  const inWorldDate = getAttr(note, "inWorldDate") ?? getAttr(note, "date") ?? getAttr(note, "year");
  const era = getAttr(note, "era");
  const description = getAttr(note, "description") ?? getAttr(note, "summary");
  const loreType = getAttr(note, "loreType");

  return (
    <div className="flex gap-4">
      {/* Timeline spine dot */}
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full bg-primary/60 ring-2 ring-primary/20 mt-1 shrink-0" />
        <div className="w-px flex-1 bg-border/30 mt-1" />
      </div>

      {/* Card */}
      <Card className="flex-1 mb-4 border-border/50 bg-card/60 hover:bg-card/80 transition-colors">
        <CardHeader className="px-4 py-3 pb-1">
          <div className="flex items-start gap-2 flex-wrap">
            {inWorldDate && (
              <Badge variant="outline" className="text-[10px] px-2 shrink-0 font-mono">
                <Clock className="h-2.5 w-2.5 mr-1" />
                {inWorldDate}
              </Badge>
            )}
            {era && (
              <Badge variant="outline" className="text-[10px] px-2 shrink-0 text-muted-foreground">
                {era}
              </Badge>
            )}
            {loreType && (
              <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded border ${loreTypeBadgeColor(loreType)}`}>
                {loreType}
              </span>
            )}
          </div>
          <CardTitle className="text-sm mt-1">
            <Link
              href={`/lore/${note.noteId}`}
              className="hover:text-primary transition-colors flex items-center gap-1 group"
            >
              {note.title}
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
            </Link>
          </CardTitle>
        </CardHeader>
        {description && (
          <CardContent className="px-4 py-2">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

type EraGroup = { era: string; notes: TimelineNote[] };

function groupByEra(notes: TimelineNote[]): EraGroup[] {
  const eraMap = new Map<string, TimelineNote[]>();
  for (const n of notes) {
    const era = getAttr(n, "era") ?? "Unknown Era";
    const group = eraMap.get(era);
    if (group) group.push(n);
    else eraMap.set(era, [n]);
  }
  return Array.from(eraMap.entries()).map(([era, notes]) => ({ era, notes }));
}

function sortByDate(notes: TimelineNote[]): TimelineNote[] {
  return [...notes].sort((a, b) => {
    const da = getAttr(a, "inWorldDate") ?? getAttr(a, "date") ?? getAttr(a, "year") ?? "";
    const db = getAttr(b, "inWorldDate") ?? getAttr(b, "date") ?? getAttr(b, "year") ?? "";
    return da.localeCompare(db, undefined, { numeric: true, sensitivity: "base" });
  });
}

export default function TimelinePage() {
  const { data: notes, isLoading, isError } = useQuery<TimelineNote[]>({
    queryKey: ["timeline"],
    queryFn: () => fetch("/api/timeline").then((r) => r.json()),
    staleTime: 30_000,
  });

  const hasEraLabels = (notes ?? []).some((n) => !!getAttr(n, "era"));
  const sorted = sortByDate(notes ?? []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 shrink-0">
        <CalendarDays className="h-5 w-5 text-primary" />
        <h1 className="font-bold text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
          Timeline
        </h1>
        {notes && (
          <Badge variant="outline" className="ml-auto text-xs">
            {notes.length} entr{notes.length === 1 ? "y" : "ies"}
          </Badge>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-6 max-w-3xl">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading timeline…
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center py-20 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed to load timeline. Check your AllCodex connection in Settings.
            </div>
          )}
          {!isLoading && !isError && sorted.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                No timeline entries found. Create notes with{" "}
                <code className="text-xs bg-muted px-1 rounded">#loreType=event</code> or{" "}
                <code className="text-xs bg-muted px-1 rounded">#loreType=timeline</code> in AllCodex.
              </p>
            </div>
          )}
          {!isLoading && !isError && sorted.length > 0 && (
            <>
              {hasEraLabels ? (
                groupByEra(sorted).map(({ era, notes: eraGroup }) => (
                  <div key={era} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        {era}
                      </h2>
                      <div className="flex-1 h-px bg-border/30" />
                    </div>
                    {eraGroup.map((note) => (
                      <EventCard key={note.noteId} note={note} />
                    ))}
                  </div>
                ))
              ) : (
                sorted.map((note) => (
                  <EventCard key={note.noteId} note={note} />
                ))
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
