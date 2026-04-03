"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { LoreEditor } from "@/components/editor/LoreEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Eye, EyeOff, ArrowLeft, Save } from "lucide-react";
import { TemplateDef, LORE_TEMPLATES } from "@/components/editor/TemplatePicker";
import { PromotedFields } from "@/components/editor/PromotedFields";

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
  const [template, setTemplate] = useState<TemplateDef | null>(null);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});

  const { isLoading: noteLoading, data: noteData } = useQuery<Note>({
    queryKey: ["note", id],
    queryFn: () => fetch(`/api/lore/${id}`).then((response) => response.json()),
  });

  const { isLoading: contentLoading, data: fetchedContent } = useQuery<string>({
    queryKey: ["note-content", id],
    queryFn: () => fetch(`/api/lore/${id}/content`).then((response) => response.text()),
  });

  // Sync note data into local state once (allow user edits to diverge)
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!noteData || initializedRef.current) return;
    initializedRef.current = true;

    if (title === null) setTitle(noteData.title ?? "");

    const draftAttr = noteData.attributes?.find((attribute) => attribute.name === "draft");
    setIsDraft(!!draftAttr);
    setDraftAttrId(draftAttr?.attributeId || null);

    if (template === null) {
      const loreTypeAttr = noteData.attributes?.find((attribute) => attribute.name === "loreType");
      const foundTemplate = LORE_TEMPLATES.find((candidate) => candidate.value === loreTypeAttr?.value) || null;
      setTemplate(foundTemplate);

      if (foundTemplate && Object.keys(attributeValues).length === 0) {
        const initialValues: Record<string, string> = {};
        foundTemplate.attributes.forEach((attr) => {
          const sanitizedKey = attr.replace(/\s+/g, "_");
          const attrData = noteData.attributes?.find((attribute) => attribute.name === sanitizedKey);
          if (attrData) {
            initialValues[attr] = attrData.value;
          }
        });
        setAttributeValues(initialValues);
      }
    }
  }, [noteData]);

  useEffect(() => {
    if (fetchedContent !== undefined && content === null) {
      setContent(fetchedContent);
    }
  }, [fetchedContent]);

  const isLoading = noteLoading || contentLoading;

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (title !== null) {
        const response = await fetch(`/api/lore/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!response.ok) {
          throw new Error("Failed to save title");
        }
      }

      if (template) {
        const cachedNote = qc.getQueryData<Note>(["note", id]);

        for (const attr of template.attributes) {
          const sanitizedKey = attr.replace(/\s+/g, "_");
          const existingAttr = cachedNote?.attributes?.find(
            (attribute) => attribute.name === sanitizedKey && attribute.type === "label",
          );
          const newValue = attributeValues[attr] || "";

          if (existingAttr) {
            if (newValue.trim() === "") {
              await fetch(`/api/lore/${id}/attributes?attrId=${existingAttr.attributeId}`, { method: "DELETE" });
            } else if (existingAttr.value !== newValue.trim()) {
              await fetch(`/api/lore/${id}/attributes?attrId=${existingAttr.attributeId}`, { method: "DELETE" });
              await fetch(`/api/lore/${id}/attributes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "label", name: sanitizedKey, value: newValue.trim() }),
              });
            }
          } else if (newValue.trim() !== "") {
            await fetch(`/api/lore/${id}/attributes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "label", name: sanitizedKey, value: newValue.trim() }),
            });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note", id] });
      qc.invalidateQueries({ queryKey: ["note-content", id] });
      router.push(`/lore/${id}`);
    },
    onError: (error: Error) => setSaveError(error.message),
  });

  const { mutate: toggleDraft, isPending: togglingDraft } = useMutation({
    onMutate: () => {
      setIsDraft((current) => !current);
    },
    mutationFn: async () => {
      if (isDraft && draftAttrId) {
        const response = await fetch(`/api/lore/${id}/attributes?attrId=${draftAttrId}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to publish");
        }
      } else {
        const response = await fetch(`/api/lore/${id}/attributes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "label", name: "draft", value: "" }),
        });
        if (!response.ok) {
          throw new Error("Failed to set as draft");
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["note", id] });
    },
    onError: (error: Error) => {
      setIsDraft((current) => !current);
      setSaveError(error.message);
    },
  });

  const { mutate: deleteNote, isPending: deleting } = useMutation({
    mutationFn: () =>
      fetch(`/api/lore/${id}`, { method: "DELETE" }).then((response) => {
        if (!response.ok) throw new Error("Delete failed");
      }),
    onSuccess: () => router.push("/lore"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1500px] space-y-8">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-14 w-96 max-w-full" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[680px] w-full rounded-[1.75rem]" />
          <Skeleton className="h-[420px] w-full rounded-[1.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.35em] text-primary/70" style={{ fontFamily: "var(--font-cinzel)" }}>
            Archivist&apos;s Manuscript
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary md:text-3xl" style={{ fontFamily: "var(--font-cinzel)" }}>
              Edit Lore Entry
            </h1>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/lore/${id}`)}
            disabled={deleting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => toggleDraft()}
            disabled={saving || deleting || togglingDraft}
            className="gap-2 border-amber-500/30 text-amber-600/80 hover:bg-amber-500/10"
          >
            {isDraft ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {isDraft ? "Publish" : "Revert to Draft"}
          </Button>
          <Button
            variant="default"
            onClick={() => save()}
            disabled={saving || deleting || togglingDraft}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving Metadata..." : "Save Metadata"}
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
                value={title ?? ""}
                onChange={(event) => setTitle(event.target.value)}
                disabled={saving}
                placeholder="Name this entry"
                className="h-auto border-none bg-transparent px-0 py-0 text-4xl font-bold text-primary shadow-none focus-visible:ring-0 md:text-5xl"
                style={{ fontFamily: "var(--font-cinzel)" }}
              />
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                Compose the manuscript in block form. Content autosaves as HTML for AllCodex compatibility while metadata stays explicit here.
              </p>
            </div>

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

          {saveError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {saveError}
            </div>
          )}
        </section>

        <aside className="self-start space-y-4 xl:sticky xl:top-6">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground" style={{ fontFamily: "var(--font-cinzel)" }}>
              Entry Properties
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Template</div>
                <div className="mt-1 font-medium text-foreground">{template?.label ?? "General Lore"}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {template?.description ?? "A freeform lore entry without a template-bound schema."}
                </p>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Visibility</div>
                <div className="mt-1 inline-flex rounded-full border border-border/70 px-3 py-1 text-xs uppercase tracking-[0.25em] text-foreground">
                  {isDraft ? "Draft" : "Published"}
                </div>
              </div>
            </div>
          </div>

          {template && (
            <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
              <PromotedFields
                template={template}
                values={attributeValues}
                onChange={(key, value) => setAttributeValues((prev) => ({ ...prev, [key]: value }))}
                disabled={saving}
              />
            </div>
          )}

          <div className="rounded-[1.5rem] border border-border/70 bg-card/60 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground" style={{ fontFamily: "var(--font-cinzel)" }}>
              Dangerous Actions
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Removing an entry deletes the manuscript and its metadata from the codex.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this entry permanently?")) deleteNote();
              }}
              disabled={saving || deleting}
              className="mt-4 w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Entry
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
