"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, ExternalLink, Loader2, AlertCircle, Check, X, Compass } from "lucide-react";
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

function QuestCard({ note }: { note: QuestNote }) {
  const description = getAttr(note, "description") ?? getAttr(note, "summary");
  const location = getAttr(note, "location");
  const linkedNotes = note.attributes.filter((a) => a.type === "relation").slice(0, 4);

  return (
    <div className="border-b border-border/20 p-4 hover:bg-card/80 transition-colors">
      <Link
        href={`/lore/${note.noteId}`}
        className="font-semibold text-sm hover:text-primary transition-colors flex items-center gap-1.5 group mb-1"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        <span className="leading-tight">{note.title}</span>
        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />
      </Link>
      {location && (
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <MapPin className="h-2.5 w-2.5 shrink-0" />
          {location}
        </p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2" style={{ fontFamily: "var(--font-crimson)" }}>
          {description}
        </p>
      )}
      {linkedNotes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {linkedNotes.map((a) => (
            <Link
              key={`${a.name}-${a.value}`}
              href={`/lore/${a.value}`}
              className="inline-flex items-center gap-0.5 text-[10px] text-primary/70 hover:text-primary px-1.5 py-0.5 border border-primary/20 hover:border-primary/40 transition-colors"
            >
              {a.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestColumn({
  title,
  quests,
  colorClass,
  headerBg,
  icon: Icon,
  emptyMsg,
}: {
  title: string;
  quests: QuestNote[];
  colorClass: string;
  headerBg: string;
  icon: React.ElementType;
  emptyMsg: string;
}) {
  return (
    <div className="flex flex-col border-r border-border/20 last:border-r-0">
      <div className={`px-4 py-3 border-b border-border/20 ${headerBg} shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-3.5 w-3.5 ${colorClass}`} />
            <span
              className={`text-xs font-semibold uppercase tracking-[0.12em] ${colorClass}`}
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              {title}
            </span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-none ${colorClass} bg-current/10`}>
            {quests.length}
          </span>
        </div>
      </div>
      <ScrollArea className="flex-1">
        {quests.length === 0 ? (
          <p className="text-xs text-muted-foreground/50 text-center py-8 italic">{emptyMsg}</p>
        ) : (
          quests.map((q) => <QuestCard key={q.noteId} note={q} />)
        )}
      </ScrollArea>
    </div>
  );
}

export default function QuestsPage() {
  const [activeTab, setActiveTab] = useState<QuestStatus>("all");

  const { data: quests, isLoading, isError } = useQuery<QuestNote[]>({
    queryKey: ["quests"],
    queryFn: () => fetch("/api/quests").then((r) => r.json()),
    staleTime: 30_000,
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

  const byStatus = (status: string) =>
    (quests ?? []).filter((q) => {
      const s = (getAttr(q, "questStatus") ?? getAttr(q, "status") ?? "unknown").toLowerCase();
      return s === status;
    });

  const filtered = (quests ?? []).filter((q) => {
    if (activeTab === "all") return true;
    const status = getAttr(q, "questStatus") ?? getAttr(q, "status") ?? "unknown";
    return status.toLowerCase() === activeTab;
  });

  // suppress unused warning — filtered kept for potential future use
  void filtered;
  void counts;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/40 shrink-0 bg-card/20">
        <MapPin className="h-4 w-4 text-primary" />
        <h1 className="font-bold text-base text-primary tracking-wide" style={{ fontFamily: "var(--font-cinzel)" }}>
          Quests &amp; Hooks
        </h1>
        {quests && (
          <Badge variant="outline" className="ml-auto text-xs rounded-none border-border/60">
            {quests.length} total
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground flex-1">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading quests…
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center py-20 text-destructive gap-2 flex-1">
          <AlertCircle className="h-5 w-5" />
          Failed to load quests. Check your AllCodex connection in Settings.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          <QuestColumn
            title="Active"
            quests={byStatus("active")}
            colorClass="text-primary"
            headerBg="bg-primary/5 border-t-2 border-primary"
            icon={Compass}
            emptyMsg="No active quests"
          />
          <QuestColumn
            title="Complete"
            quests={byStatus("complete")}
            colorClass="text-[var(--accent)]"
            headerBg="bg-[var(--accent)]/5 border-t-2 border-[var(--accent)]"
            icon={Check}
            emptyMsg="No completed quests"
          />
          <QuestColumn
            title="Failed"
            quests={byStatus("failed")}
            colorClass="text-destructive"
            headerBg="bg-destructive/5 border-t-2 border-destructive"
            icon={X}
            emptyMsg="No failed quests"
          />
        </div>
      )}
      {!isLoading && !isError && quests?.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-20 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No quest notes found. Create notes with the #quest label in AllCodex.</p>
          </div>
        </div>
      )}
    </div>
  );
}
