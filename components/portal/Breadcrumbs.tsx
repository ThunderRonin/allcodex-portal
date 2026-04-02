"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface AncestorNode {
  noteId: string;
  title: string;
}

export function Breadcrumbs({ noteId }: { noteId: string }) {
  const { data: ancestors = [], isLoading } = useQuery<AncestorNode[]>({
    queryKey: ["breadcrumbs", noteId],
    queryFn: async () => {
      const r = await fetch(`/api/lore/${noteId}/breadcrumbs`);
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return <Skeleton className="h-4 w-40" />;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap"
    >
      <Link
        href="/lore"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <BookOpen className="h-3 w-3" />
        Lore
      </Link>
      {ancestors.map((a) => (
        <span key={a.noteId} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          <Link
            href={`/lore/${a.noteId}`}
            className="hover:text-foreground transition-colors truncate max-w-[160px]"
          >
            {a.title}
          </Link>
        </span>
      ))}
    </nav>
  );
}
