"use client";

import { useState, Suspense, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoreEditor } from "@/components/editor/LoreEditor";
import { Save, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TemplatePicker, TemplateDef } from "@/components/editor/TemplatePicker";
import { PromotedFields } from "@/components/editor/PromotedFields";

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

  useEffect(() => {
    if (searchParams.get("parentId")) return; // explicit param wins
    fetch("/api/config/portal")
      .then((r) => r.json())
      .then((d) => { if (d.loreRootNoteId) setParentId(d.loreRootNoteId); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [content, setContent] = useState("");
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
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
          attributes: attributeValues,
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
    <div className="mx-auto w-full max-w-[1500px] space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.35em] text-primary/70" style={{ fontFamily: "var(--font-cinzel)" }}>
            Archivist&apos;s Manuscript
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl" style={{ fontFamily: "var(--font-cinzel)" }}>
              New Lore Entry
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Draft a new codex manuscript with block-based structure from the start.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild disabled={isPending} className="gap-2">
            <Link href="/lore">
              <ArrowLeft className="h-4 w-4" />
              Back to Lore
            </Link>
          </Button>
          <Button variant="outline" asChild disabled={isPending} className="gap-2">
            <Link href="/lore">
              <X className="h-4 w-4" />
              Cancel
            </Link>
          </Button>
          <Button
            onClick={() => createNote()}
            disabled={!title.trim() || isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isPending ? "Creating Entry..." : "Create Entry"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6">
          <div className="rounded-[1.75rem] border border-border/70 bg-card/50 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] sm:p-8">
            <div className="mb-6 border-b border-border/50 pb-6">
              <div className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground" style={{ fontFamily: "var(--font-cinzel)" }}>
                Canon Entry Title
              </div>
              <Input
                id="title"
                placeholder="e.g. Aelarion the Undying"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                className="h-auto border-none bg-transparent px-0 py-0 text-4xl font-bold text-primary shadow-none focus-visible:ring-0 md:text-5xl"
                style={{ fontFamily: "var(--font-cinzel)" }}
              />
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Start with a blank manuscript or paste existing HTML. The editor preserves the current AllCodex HTML storage contract while giving you block-level composition.
              </p>
            </div>

            <LoreEditor
              initialContent={content}
              onSave={setContent}
              className="min-h-[400px]"
              showSaveStatus={false}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </section>

        <aside className="space-y-4 xl:sticky xl:top-6 self-start">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground" style={{ fontFamily: "var(--font-cinzel)" }}>
              Entry Properties
            </div>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Template</div>
                {!template ? (
                  <Button
                    variant="outline"
                    className="mt-2 w-full justify-start border-dashed text-muted-foreground"
                    onClick={() => setIsPickerOpen(true)}
                    disabled={isPending}
                  >
                    + Choose a template...
                  </Button>
                ) : (
                  <div className="mt-2 rounded-xl border border-border/60 bg-background/30 p-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary shrink-0">
                        <template.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-foreground">{template.label}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 px-0 text-xs uppercase tracking-[0.25em] text-primary hover:bg-transparent"
                      onClick={() => setIsPickerOpen(true)}
                      disabled={isPending}
                    >
                      Change Template
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Parent Note</div>
                <Input
                  id="parentId"
                  placeholder="root or note ID"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={isPending}
                  className="mt-2 font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {template && (
            <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
              <PromotedFields
                template={template}
                values={attributeValues}
                onChange={(key, value) => setAttributeValues((prev) => ({ ...prev, [key]: value }))}
                disabled={isPending}
              />
            </div>
          )}
        </aside>

        <TemplatePicker
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          onSelect={setTemplate}
        />
      </div>
    </div>
  );
}
