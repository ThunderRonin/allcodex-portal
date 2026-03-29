"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { LoreEditor } from "@/components/editor/LoreEditor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface Note {
  noteId: string;
  title: string;
  type: string;
  attributes?: Array<{ name: string; value: string; type: string; attributeId: string }>;
}

export default function EditLorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [draftAttrId, setDraftAttrId] = useState<string | null>(null);

  // Load note metadata
  const { isLoading: noteLoading } = useQuery<Note>({
    queryKey: ["note", id],
    queryFn: () => fetch(`/api/lore/${id}`).then((r) => r.json()),
    onSuccess: (data: Note) => {
      if (title === null) setTitle(data.title ?? "");
      const draftAttr = data.attributes?.find((a) => a.name === "draft");
      setIsDraft(!!draftAttr);
      setDraftAttrId(draftAttr?.attributeId || null);
    },
  } as any);

  // Load note content
  const { isLoading: contentLoading } = useQuery<string>({
    queryKey: ["note-content", id],
    queryFn: () =>
      fetch(`/api/lore/${id}/content`).then((r) => r.text()),
    onSuccess: (data: string) => {
      if (content === null) setContent(data);
    },
  } as any);

  const isLoading = noteLoading || (contentLoading && content === null);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (title !== null) {
        const res = await fetch(`/api/lore/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error("Failed to save title");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note", id] });
      qc.invalidateQueries({ queryKey: ["note-content", id] });
      router.push(`/lore/${id}`);
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  const { mutate: toggleDraft, isPending: togglingDraft } = useMutation({
    onMutate: () => {
      // Optimistic upate
      setIsDraft(!isDraft);
    },
    mutationFn: async () => {
      if (isDraft && draftAttrId) {
        const res = await fetch(`/api/lore/${id}/attributes?attrId=${draftAttrId}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to publish");
      } else {
        const res = await fetch(`/api/lore/${id}/attributes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "label", name: "draft", value: "" })
        });
        if (!res.ok) throw new Error("Failed to set as draft");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note", id] });
    },
    onError: (e: Error) => {
      // Revert optimistic update
      setIsDraft(isDraft);
      setSaveError(e.message);
    },
  });

  const { mutate: deleteNote, isPending: deleting } = useMutation({
    mutationFn: () =>
      fetch(`/api/lore/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Delete failed");
      }),
    onSuccess: () => router.push("/lore"),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold text-primary"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          Edit Entry
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5 font-mono text-xs">
          {id}
        </p>
      </div>

      <div className="space-y-4 rounded-lg border border-border/60 bg-card/60 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title ?? ""}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">
            Content{" "}
            <span className="text-muted-foreground text-xs">(HTML)</span>
          </Label>
          <div className="flex-1 mt-6">
          <LoreEditor
            initialContent={content ?? ""}
            onSave={(html) => {
              fetch(`/api/lore/${id}/content`, {
                method: "PUT",
                headers: { "Content-Type": "text/html" },
                body: html,
              });
            }}
          />
        </div>
        </div>

        {saveError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {saveError}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Delete this entry permanently?")) deleteNote();
            }}
            disabled={saving || deleting}
            className="gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => toggleDraft()}
              disabled={saving || deleting || togglingDraft}
              className="gap-2 border-amber-500/30 hover:bg-amber-500/10 text-amber-600/80"
            >
              {isDraft ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {isDraft ? "Publish" : "Revert to Draft"}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/lore/${id}`)}
              disabled={deleting}
            >
              Back to Entry
            </Button>
            <Button
              variant="default"
              onClick={() => save()}
              disabled={saving || deleting || togglingDraft}
            >
              {saving ? "Saving Summary..." : "Save Title/Type"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
