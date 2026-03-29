"use client";

import { useQuery } from "@tanstack/react-query";
import { LORE_TEMPLATES } from "@/components/editor/TemplatePicker";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

interface LoreNote {
  noteId: string;
  title: string;
  parentNoteIds: string[];
  attributes: any[];
}

export function LoreTree({ 
  onSelectNode,
  selectedId 
}: { 
  onSelectNode?: (id: string | null) => void;
  selectedId?: string | null;
}) {
  const { data: notes = [], isLoading } = useQuery<LoreNote[]>({
    queryKey: ["loreNotes"],
    queryFn: async () => {
      const res = await fetch("/api/lore?q=" + encodeURIComponent("#lore"));
      if (!res.ok) throw new Error("Failed to fetch lore");
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading categories...</div>;
  }

  // Count notes per type
  const counts: Record<string, number> = {};
  let totalTemplates = 0;
  notes.forEach(note => {
    const type = note.attributes?.find((a: any) => a.name === "loreType")?.value;
    if (type && LORE_TEMPLATES.some(t => t.value === type)) {
      counts[type] = (counts[type] || 0) + 1;
      totalTemplates++;
    }
  });

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 space-y-1">
      <button
        onClick={() => onSelectNode?.("All")}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
          !selectedId || selectedId === "All" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span>All Categories</span>
        </div>
        <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{totalTemplates}</span>
      </button>

      {LORE_TEMPLATES.map(template => {
        const count = counts[template.value] || 0;
        const Icon = template.icon;
        
        return (
          <button
            key={template.value}
            onClick={() => onSelectNode?.(template.value)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors",
              selectedId === template.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{template.label}</span>
            </div>
            {count > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
