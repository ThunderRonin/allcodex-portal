"use client";

import { useState, Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoreEditor } from "@/components/editor/LoreEditor";
import { Save, X, BookOpen } from "lucide-react";
import Link from "next/link";
import { TemplatePicker, TemplateDef } from "@/components/editor/TemplatePicker";

export default function NewLorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewLoreContent />
    </Suspense>
  );
}

function NewLoreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<TemplateDef | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [parentId, setParentId] = useState(searchParams.get("parentId") || "");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: createNote, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          loreType: template?.value || "lore",
          templateId: template?.templateId || undefined,
          parentNoteId: parentId.trim() || undefined,
          content: content || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data: { note?: { noteId?: string }; noteId?: string }) => {
      const id = data?.note?.noteId ?? (data as any).noteId;
      router.push(id ? `/lore/${id}` : "/lore");
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <div>
          <h1
            className="text-2xl font-bold text-primary"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            New Lore Entry
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a new entry to the chronicle.
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-border/60 bg-card/60 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g. Aldric Stonehaven"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label>Template</Label>
            
            {!template ? (
              <Button 
                variant="outline" 
                className="w-full h-10 border-dashed justify-start text-muted-foreground"
                onClick={() => setIsPickerOpen(true)}
                disabled={isPending}
              >
                + Choose a template...
              </Button>
            ) : (
              <div className="relative rounded-lg border border-border bg-card p-3 shadow-sm flex items-start gap-3 group">
                <div className="rounded-md bg-primary/10 p-2 text-primary shrink-0">
                  <template.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground">{template.label}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2 text-xs absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsPickerOpen(true)}
                  disabled={isPending}
                >
                  Change
                </Button>
              </div>
            )}
            <TemplatePicker 
              open={isPickerOpen} 
              onOpenChange={setIsPickerOpen} 
              onSelect={setTemplate} 
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parentId">
              Parent Note ID{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="parentId"
              placeholder="root or note ID"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={isPending}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">
            Initial Content{" "}
            <span className="text-muted-foreground text-xs">
              (optional, plain text or HTML)
            </span>
          </Label>
          <div className="flex-1 mt-6">
            <LoreEditor
              initialContent={content}
              onSave={setContent}
              className="min-h-[400px]"
              showSaveStatus={false}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="outline" size="sm" asChild disabled={isPending}>
            <Link href="/lore">
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => createNote()}
            disabled={!title.trim() || isPending}
            className="gap-1.5"
          >
            <Save className="h-4 w-4" />
            Create Entry
          </Button>
        </div>
      </div>
    </div>
  );
}
