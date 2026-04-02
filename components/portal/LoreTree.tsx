"use client";

import { useQuery } from "@tanstack/react-query";
import { LORE_TEMPLATES } from "@/components/editor/TemplatePicker";
import { cn } from "@/lib/utils";
import { Layers, GitBranch, ChevronRight } from "lucide-react";
import { useState } from "react";

interface LoreNote {
  noteId: string;
  title: string;
  parentNoteIds: string[];
  attributes: any[];
}

interface TreeNode {
  id: string;
  name: string;
  loreType?: string;
  children: TreeNode[];
}

function buildTree(notes: LoreNote[]): TreeNode[] {
  const noteIds = new Set(notes.map((n) => n.noteId));
  const map: Record<string, TreeNode> = {};
  notes.forEach((n) => {
    map[n.noteId] = {
      id: n.noteId,
      name: n.title,
      loreType: n.attributes?.find((a: any) => a.name === "loreType")?.value,
      children: [],
    };
  });
  const roots: TreeNode[] = [];
  notes.forEach((n) => {
    const parent = n.parentNoteIds?.[0];
    if (parent && noteIds.has(parent)) {
      map[parent].children.push(map[n.noteId]);
    } else {
      roots.push(map[n.noteId]);
    }
  });
  return roots;
}

function TreeNodeRow({
  node,
  depth,
  selectedId,
  onSelectNode,
}: {
  node: TreeNode;
  depth: number;
  selectedId?: string | null;
  onSelectNode?: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const template = LORE_TEMPLATES.find((t) => t.value === node.loreType);
  const Icon = template?.icon;

  return (
    <div>
      <button
        onClick={() => {
          onSelectNode?.(node.id);
          if (hasChildren) setOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-1.5 text-xs rounded transition-colors text-left",
          selectedId === node.id
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-90")}
          />
        ) : (
          <span className="w-3 h-3 shrink-0" />
        )}
        {Icon ? (
          <Icon className="h-3 w-3 shrink-0" />
        ) : (
          <span className="w-3 h-3 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function LoreTree({ 
  onSelectNode,
  selectedId 
}: { 
  onSelectNode?: (id: string | null) => void;
  selectedId?: string | null;
}) {
  const [tab, setTab] = useState<"types" | "tree">("types");

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

  const treeData = buildTree(notes);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Tab switcher */}
      <div className="flex border-b border-border/40 shrink-0">
        {(["types", "tree"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
              tab === t
                ? "border-b-2 border-primary text-primary -mb-px"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "types" ? <Layers className="h-3.5 w-3.5" /> : <GitBranch className="h-3.5 w-3.5" />}
            {t === "types" ? "Types" : "Tree"}
          </button>
        ))}
      </div>

      {tab === "types" ? (
        <div className="p-2 space-y-1">
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
      ) : (
        <div className="p-2">
          {treeData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No hierarchy found</p>
          ) : (
            treeData.map((node) => (
              <TreeNodeRow
                key={node.id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelectNode={onSelectNode}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

