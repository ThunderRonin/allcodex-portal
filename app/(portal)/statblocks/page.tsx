"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, BookOpen, Search } from "lucide-react";
import { StatblockCardCompact } from "@/components/portal/StatblockCard";

interface StatblockNote {
  noteId: string;
  title: string;
  attributes: Array<{ name: string; value: string; type: string }>;
}

function attr(note: StatblockNote, name: string): string | undefined {
  return note.attributes.find((a) => a.name === name)?.value;
}

const CR_ORDER: Record<string, number> = {
  "0": 0, "1/8": 0.125, "1/4": 0.25, "1/2": 0.5,
};
function crToNum(cr: string | undefined): number {
  if (!cr) return -1;
  if (cr in CR_ORDER) return CR_ORDER[cr];
  return parseFloat(cr) ?? -1;
}

export default function StatblocksPage() {
  const [search, setSearch] = useState("");
  const [crFilter, setCrFilter] = useState<"all" | "low" | "mid" | "high">("all");

  const { data: statblocks, isLoading, isError } = useQuery<StatblockNote[]>({
    queryKey: ["statblocks"],
    queryFn: () => fetch("/api/statblocks").then((r) => r.json()),
    staleTime: 30_000,
  });

  const filtered = (statblocks ?? []).filter((n) => {
    const name = (attr(n, "crName") ?? n.title).toLowerCase();
    const type = (attr(n, "creatureType") ?? "").toLowerCase();
    if (search && !name.includes(search.toLowerCase()) && !type.includes(search.toLowerCase())) {
      return false;
    }
    if (crFilter !== "all") {
      const cr = crToNum(attr(n, "challengeRating") ?? attr(n, "crLevel"));
      if (crFilter === "low" && cr > 4) return false;
      if (crFilter === "mid" && (cr < 5 || cr > 14)) return false;
      if (crFilter === "high" && cr < 15) return false;
    }
    return true;
  });

  // Sort by CR
  const sorted = [...filtered].sort((a, b) => {
    return crToNum(attr(a, "challengeRating") ?? attr(a, "crLevel")) -
           crToNum(attr(b, "challengeRating") ?? attr(b, "crLevel"));
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 shrink-0">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="font-bold text-lg" style={{ fontFamily: "var(--font-cinzel)" }}>
          Statblock Library
        </h1>
        {statblocks && (
          <Badge variant="outline" className="ml-auto text-xs">
            {statblocks.length} entries
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border/30 shrink-0 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or type…"
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "low", "mid", "high"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setCrFilter(tier)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                crFilter === tier
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tier === "all" ? "All CR" : tier === "low" ? "CR 0–4" : tier === "mid" ? "CR 5–14" : "CR 15+"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading statblocks…
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center py-20 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed to load statblocks. Check your AllCodex connection in Settings.
            </div>
          )}
          {!isLoading && !isError && sorted.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {statblocks?.length === 0
                  ? "No statblocks found. Create notes with the #statblock label in AllCodex."
                  : "No statblocks match your search."}
              </p>
            </div>
          )}
          {!isLoading && !isError && sorted.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {sorted.map((n) => (
                <StatblockCardCompact key={n.noteId} note={n} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
