"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface NotePreviewData {
  noteId: string;
  title: string;
  attributes: Array<{ name: string; value: string; type: string }>;
}

function NotePreviewContent({ noteId }: { noteId: string }) {
  const { data, isLoading } = useQuery<NotePreviewData>({
    queryKey: ["note-preview", noteId],
    queryFn: async () => {
      const r = await fetch(`/api/lore/${noteId}`);
      if (!r.ok) throw new Error("not found");
      return r.json();
    },
    staleTime: 120_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const loreType = data.attributes?.find((a) => a.name === "loreType")?.value;
  const promoted = (data.attributes ?? [])
    .filter(
      (a) =>
        a.type === "label" &&
        a.value &&
        !["loreType", "lore", "template", "iconClass"].includes(a.name) &&
        !a.name.startsWith("#") &&
        !a.value.startsWith("promoted"),
    )
    .slice(0, 3);

  return (
    <div className="space-y-2 max-w-[220px]">
      <div className="flex items-start gap-2">
        <BookOpen className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            {data.title}
          </p>
          {loreType && (
            <Badge variant="outline" className="text-[10px] mt-0.5 capitalize">
              {loreType}
            </Badge>
          )}
        </div>
      </div>
      {promoted.length > 0 && (
        <div className="space-y-1 border-t border-border/40 pt-1.5">
          {promoted.map((a) => (
            <div key={a.name} className="flex gap-2 text-xs">
              <span className="text-muted-foreground capitalize shrink-0 w-16 truncate">
                {a.name.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className="text-foreground/80 truncate">{a.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotePreviewLink({
  noteId,
  children,
}: {
  noteId: string;
  children: ReactNode;
}) {
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <Link href={`/lore/${noteId}`}>{children}</Link>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-card border border-border/60 shadow-lg p-3"
      >
        <NotePreviewContent noteId={noteId} />
      </TooltipContent>
    </Tooltip>
  );
}
