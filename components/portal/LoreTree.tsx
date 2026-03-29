"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tree, NodeRendererProps } from "react-arborist";
import { useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, ChevronDown, FileText, User, MapPin, Shield, Bug, 
  CalendarDays, BookOpen, Diamond, Wand2, Building, Type, ListTree, Folder, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mapping lore types to icons
const ICONS: Record<string, any> = {
  character: User,
  location: MapPin,
  faction: Shield,
  creature: Bug,
  event: CalendarDays,
  manuscript: BookOpen,
  item: Diamond,
  spell: Wand2,
  building: Building,
  language: Type,
  statblock: ListTree,
};

interface LoreNote {
  noteId: string;
  title: string;
  parentNoteIds: string[];
  attributes: any[];
}

export interface TreeNode {
  id: string;
  name: string;
  loreType: string;
  isDraft: boolean;
  children?: TreeNode[];
}

function buildTree(notes: LoreNote[]): TreeNode[] {
  // 1. Create a map of all notes
  const nodeMap = new Map<string, TreeNode>();
  
  notes.forEach(note => {
    const loreTypeAttr = note.attributes?.find((a: any) => a.name === "loreType");
    const isDraft = note.attributes?.some((a: any) => a.name === "draft");

    nodeMap.set(note.noteId, {
      id: note.noteId,
      name: note.title,
      loreType: loreTypeAttr?.value || "lore",
      isDraft: !!isDraft,
      children: []
    });
  });

  const rootNodes: TreeNode[] = [];

  // 2. Build the tree structure based on parentNoteIds
  notes.forEach(note => {
    const treeNode = nodeMap.get(note.noteId);
    if (!treeNode) return;

    // Find the first valid parent in the map
    const parentId = note.parentNoteIds?.find(id => nodeMap.has(id));
    
    if (parentId) {
      const parentNode = nodeMap.get(parentId);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(treeNode);
      }
    } else {
      rootNodes.push(treeNode);
    }
  });

  return rootNodes;
}

export function LoreTree({ 
  onSelectNode,
  selectedId 
}: { 
  onSelectNode?: (id: string | null) => void;
  selectedId?: string | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const treeRef = useRef<any>(null);
  const [term, setTerm] = useState("");

  const { data: notes = [], isLoading } = useQuery<LoreNote[]>({
    queryKey: ["loreNotes"],
    queryFn: async () => {
      const res = await fetch("/api/lore?q=" + encodeURIComponent("#lore"));
      if (!res.ok) throw new Error("Failed to fetch lore");
      return res.json();
    }
  });

  const treeData = useMemo(() => buildTree(notes), [notes]);

  // Mutation for moving nodes via drag and drop
  const moveMutation = useMutation({
    mutationFn: async ({ noteId, newParentId, index }: { noteId: string, newParentId: string, index?: number }) => {
      const res = await fetch("/api/lore/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, newParentId, index })
      });
      if (!res.ok) throw new Error("Failed to move note");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loreNotes"] });
    }
  });

  const handleMove = ({ dragIds, parentId, index }: { dragIds: string[], parentId: string | null, index: number }) => {
    if (!parentId) return;
    const noteId = dragIds[0];
    moveMutation.mutate({ noteId, newParentId: parentId, index });
  };

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground animate-pulse">Loading categories...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 pb-2">
        <input 
          type="text" 
          placeholder="Filter tree..." 
          className="w-full bg-muted/50 border border-border/50 rounded-md px-3 py-1.5 text-sm outline-none focus:border-primary/50 transition-colors"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-auto p-2">
        <Tree
          ref={treeRef}
          data={treeData}
          searchTerm={term}
          width="100%"
          height={600}
          rowHeight={32}
          onMove={handleMove}
          padding={8}
          indent={16}
          selection={selectedId || ""}
        >
          {NodeRenderer}
        </Tree>
      </div>
    </div>
  );
}

function NodeRenderer({ node, style, dragHandle, tree }: NodeRendererProps<TreeNode>) {
  const router = useRouter();
  const { id, name, loreType, isDraft } = node.data;
  
  const Icon = ICONS[loreType] || FileText;
  const isFolder = node.children && node.children.length > 0;
  
  // Note: We can access tree props including selectedId / onSelectNode through tree.props
  const onSelectNode = tree.props.onSelect as ((id: string) => void) | undefined;

  return (
    <div 
      style={style} 
      ref={dragHandle}
      className={cn(
        "flex items-center gap-1.5 group pr-2 rounded-md cursor-pointer transition-colors overflow-hidden",
        node.isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-foreground",
        isDraft && "opacity-70"
      )}
      onClick={(e) => {
        // Prevent click from affecting the dropdown or bubbling
        if (isFolder) node.toggle();
        tree.select(node.id);
        
        // We know we mapped onSelectNode to selection handler
      }}
    >
      <div 
        className="shrink-0 w-5 h-5 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          node.toggle();
        }}
      >
        {isFolder ? (
          node.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        ) : (
          <span className="w-4" />
        )}
      </div>
      
      <div className="shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
        {isFolder && !node.isOpen ? <Folder className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      </div>
      
      <span className="truncate text-sm flex-1">{name}</span>
      
      {isDraft && (
        <span className="shrink-0 text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
          DRAFT
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div 
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-4 h-4" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
          <DropdownMenuItem onClick={() => router.push(`/lore/${id}`)}>
            Open Entry
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/lore/new?parentId=${id}`)}>
            New Child Entry
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
              tree.select(node.id);
              router.push(`/lore/${id}/edit`);
            }}>
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
