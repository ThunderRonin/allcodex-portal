"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ServiceBanner } from "@/components/portal/ServiceBanner";
import { fetchJsonOrThrow } from "@/lib/fetch-json";
import { sanitizeLoreHtml } from "@/lib/sanitize";
import type { ChatMessage, CopilotApplyResult, CopilotChatResponse, CopilotProposal, CopilotProposalTarget } from "@/lib/allknower-schemas";

type ExistingTargetSnapshot = {
  title: string;
  loreType: string;
  contentHtml: string;
  parentNoteIds: string[];
};

type ArticleCopilotProps = {
  noteId: string;
};

function targetRoleLabel(noteId: string, target: CopilotProposalTarget) {
  if (target.kind === "create") return "new linked note";
  if (target.targetId === noteId) return "current";
  return "linked existing";
}

async function fetchTargetSnapshot(noteId: string): Promise<ExistingTargetSnapshot> {
  const [note, contentHtml] = await Promise.all([
    fetchJsonOrThrow<{
      title: string;
      parentNoteIds?: string[];
      attributes: Array<{ name: string; value: string }>;
    }>(`/api/lore/${noteId}`),
    fetch(`/api/lore/${noteId}/content`).then((response) => response.text()),
  ]);

  return {
    title: note.title,
    loreType: note.attributes.find((attribute) => attribute.name === "loreType")?.value ?? "lore",
    contentHtml,
    parentNoteIds: note.parentNoteIds ?? [],
  };
}

function ProposalCard({
  noteId,
  target,
  checked,
  onCheckedChange,
  snapshot,
  newNoteParentLabel,
}: {
  noteId: string;
  target: CopilotProposalTarget;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  snapshot?: ExistingTargetSnapshot;
  newNoteParentLabel: string;
}) {
  const titleBefore = snapshot?.title ?? (target.kind === "create" ? "New note" : "Loading...");
  const titleAfter = target.title ?? titleBefore;
  const contentBefore = snapshot?.contentHtml ?? "";
  const contentAfter = target.contentHtml ?? contentBefore;

  return (
    <Card className="border-accent/20 bg-background/80">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-3">
          <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(Boolean(value))} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{titleAfter}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {targetRoleLabel(noteId, target)}
                </p>
              </div>
              {target.kind === "create" && (
                <span className="text-xs text-muted-foreground">Parent: {newNoteParentLabel}</span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{target.rationale}</p>
          </div>
        </div>

        {titleBefore !== titleAfter && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Title Before</p>
              <p className="rounded-md border border-border/60 p-2 text-sm">{titleBefore}</p>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Title After</p>
              <p className="rounded-md border border-accent/30 p-2 text-sm">{titleAfter}</p>
            </div>
          </div>
        )}

        {target.contentHtml && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Content Before</p>
              <div
                className="max-h-40 overflow-auto rounded-md border border-border/60 p-3 text-sm lore-content"
                dangerouslySetInnerHTML={{ __html: sanitizeLoreHtml(contentBefore || "<p>No content.</p>") }}
              />
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Content After</p>
              <div
                className="max-h-40 overflow-auto rounded-md border border-accent/30 p-3 text-sm lore-content"
                dangerouslySetInnerHTML={{ __html: sanitizeLoreHtml(contentAfter) }}
              />
            </div>
          </div>
        )}

        {(target.labelUpserts.length > 0 || target.labelDeletes.length > 0) && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Label Adds</p>
              <div className="rounded-md border border-border/60 p-2 text-sm">
                {target.labelUpserts.length > 0 ? target.labelUpserts.map((label) => (
                  <p key={`${label.name}:${label.value}`}>{label.name}{label.value ? ` = ${label.value}` : ""}</p>
                )) : <p className="text-muted-foreground">None</p>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Label Removes</p>
              <div className="rounded-md border border-border/60 p-2 text-sm">
                {target.labelDeletes.length > 0 ? target.labelDeletes.map((label) => (
                  <p key={label}>{label}</p>
                )) : <p className="text-muted-foreground">None</p>}
              </div>
            </div>
          </div>
        )}

        {(target.relationAdds.length > 0 || target.relationDeletes.length > 0) && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Relation Adds</p>
              <div className="rounded-md border border-border/60 p-2 text-sm">
                {target.relationAdds.length > 0 ? target.relationAdds.map((relation, index) => (
                  <p key={`${relation.relationshipType}:${relation.targetId}:${index}`}>
                    {relation.relationshipType} → {relation.targetId} ({relation.targetKind})
                  </p>
                )) : <p className="text-muted-foreground">None</p>}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Relation Removes</p>
              <div className="rounded-md border border-border/60 p-2 text-sm">
                {target.relationDeletes.length > 0 ? target.relationDeletes.map((relation) => (
                  <p key={`${relation.relationshipType}:${relation.targetId}`}>
                    {relation.relationshipType} → {relation.targetId}
                  </p>
                )) : <p className="text-muted-foreground">None</p>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ArticleCopilot({ noteId }: ArticleCopilotProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingProposal, setPendingProposal] = useState<CopilotProposal | null>(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [targetSnapshots, setTargetSnapshots] = useState<Record<string, ExistingTargetSnapshot>>({});
  const [newNoteParentLabel, setNewNoteParentLabel] = useState("current article primary parent");
  const [isSending, setIsSending] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [confirmApplyOpen, setConfirmApplyOpen] = useState(false);
  const [lastError, setLastError] = useState<unknown>(null);
  const [errorService, setErrorService] = useState<"AllKnower" | "AllCodex">("AllKnower");
  const [lastResponse, setLastResponse] = useState<CopilotChatResponse | null>(null);
  const [applyResult, setApplyResult] = useState<CopilotApplyResult | null>(null);
  const queryClient = useQueryClient();

  const selectedCount = selectedTargetIds.length;
  const orderedTargets = pendingProposal?.targets ?? [];

  useEffect(() => {
    if (!pendingProposal) {
      setTargetSnapshots({});
      return;
    }

    const existingTargets = pendingProposal.targets.filter((target) => target.kind === "update");
    const hasCreateTargets = pendingProposal.targets.some((target) => target.kind === "create");

    let cancelled = false;
    void (async () => {
      const [entries, currentSnapshot] = await Promise.all([
        Promise.all(existingTargets.map(async (target) => {
          const snapshot = await fetchTargetSnapshot(target.targetId).catch(() => null);
          return snapshot ? [target.targetId, snapshot] as const : null;
        })),
        hasCreateTargets ? fetchTargetSnapshot(noteId).catch(() => null) : Promise.resolve(null),
      ]);

      if (cancelled) return;

      setTargetSnapshots(Object.fromEntries(entries.filter((entry): entry is readonly [string, ExistingTargetSnapshot] => entry !== null)));
      const parentId = currentSnapshot?.parentNoteIds[0];
      if (!parentId) return;

      const parent = await fetchJsonOrThrow<{ title: string }>(`/api/lore/${parentId}`).catch(() => null);
      if (!cancelled) setNewNoteParentLabel(parent ? `${parent.title} (${parentId})` : parentId);
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingProposal]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setDraft("");
    setIsSending(true);
    setLastError(null);
    setApplyResult(null);
    setMessages(nextMessages);

    try {
      const response = await fetchJsonOrThrow<CopilotChatResponse>(`/api/lore/${noteId}/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      setMessages([...nextMessages, { role: "assistant", content: response.assistantMessage }]);
      setLastResponse(response);
      setPendingProposal(response.proposal);
      setSelectedTargetIds(response.proposal?.targets.map((target) => target.targetId) ?? []);
    } catch (error) {
      setErrorService("AllKnower");
      setLastError(error);
    } finally {
      setIsSending(false);
    }
  }

  async function applySelectedChanges() {
    if (!pendingProposal || selectedTargetIds.length === 0 || isApplying) return;

    setIsApplying(true);
    setLastError(null);

    try {
      const response = await fetchJsonOrThrow<{ applied: CopilotApplyResult }>(`/api/lore/${noteId}/copilot/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal: pendingProposal,
          approvedTargetIds: selectedTargetIds,
        }),
      });

      setApplyResult(response.applied);
      setPendingProposal(null);
      setSelectedTargetIds([]);
      setConfirmApplyOpen(false);

      const touchedNoteIds = new Set([
        noteId,
        ...response.applied.updatedNoteIds,
        ...response.applied.createdNoteIds,
      ]);
      for (const touchedNoteId of touchedNoteIds) {
        void queryClient.invalidateQueries({ queryKey: ["note", touchedNoteId] });
        void queryClient.invalidateQueries({ queryKey: ["note-content", touchedNoteId] });
        void queryClient.invalidateQueries({ queryKey: ["backlinks", touchedNoteId] });
      }
      void queryClient.invalidateQueries({ queryKey: ["lore"] });
    } catch (error) {
      setErrorService("AllCodex");
      setLastError(error);
    } finally {
      setIsApplying(false);
    }
  }

  const hasConversation = messages.length > 0;
  const citations = useMemo(() => lastResponse?.citations ?? [], [lastResponse]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2 border-accent/40 text-accent hover:bg-accent/10">
          <Bot className="h-4 w-4" />
          Lore Copilot
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full border-l-border/60 bg-background/95 sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            Article-Scoped Copilot
          </SheetTitle>
          <SheetDescription>
            Discuss the current article, review explicit proposals, and apply only the changes you approve.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex h-[calc(100vh-8rem)] flex-col gap-4">
          {lastError ? <ServiceBanner service={errorService} error={lastError} /> : null}

          <ScrollArea className="flex-1 rounded-lg border border-border/60 bg-card/40 p-4">
            <div className="space-y-4">
              {!hasConversation && (
                <p className="text-sm text-muted-foreground">
                  Ask for revisions, expansions, linked-note updates, or a draft new note tied to this article.
                </p>
              )}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-lg border p-3 text-sm ${
                    message.role === "assistant"
                      ? "border-accent/20 bg-accent/5"
                      : "border-border/60 bg-background/80"
                  }`}
                >
                  <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{message.role}</p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}

              {citations.length > 0 && (
                <Card className="border-border/60 bg-background/70">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Grounding</p>
                    {citations.map((citation) => (
                      <p key={`${citation.source}:${citation.noteId}`} className="text-sm">
                        {citation.title} <span className="text-muted-foreground">({citation.source})</span>
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}

              {pendingProposal && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Review Proposal</p>
                      <p className="text-xs text-muted-foreground">{selectedCount} selected for apply</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingProposal(null);
                        setSelectedTargetIds([]);
                      }}
                    >
                      Dismiss proposal
                    </Button>
                  </div>

                  {orderedTargets.map((target) => (
                    <ProposalCard
                      key={target.targetId}
                      noteId={noteId}
                      target={target}
                      checked={selectedTargetIds.includes(target.targetId)}
                      onCheckedChange={(checked) => {
                        setSelectedTargetIds((current) => checked
                          ? [...new Set([...current, target.targetId])]
                          : current.filter((id) => id !== target.targetId));
                      }}
                      snapshot={targetSnapshots[target.targetId]}
                      newNoteParentLabel={newNoteParentLabel}
                    />
                  ))}
                </div>
              )}

              {applyResult && (
                <Card className="border-emerald-500/30 bg-emerald-500/10">
                  <CardContent className="space-y-2 p-4 text-sm">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      Apply completed
                    </div>
                    <p>Updated: {applyResult.updatedNoteIds.join(", ") || "none"}</p>
                    <p>Created: {applyResult.createdNoteIds.join(", ") || "none"}</p>
                    {applyResult.skipped.length > 0 && <p>Skipped: {applyResult.skipped.join(", ")}</p>}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          <div className="space-y-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask for article edits, linked-note updates, or a reviewable proposal."
              className="min-h-28"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                Page reload clears this session.
              </div>
              <div className="flex items-center gap-2">
                {pendingProposal && (
                  <Button
                    variant="default"
                    onClick={() => setConfirmApplyOpen(true)}
                    disabled={selectedTargetIds.length === 0 || isApplying}
                  >
                    {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Apply selected changes
                  </Button>
                )}
                <Button variant="outline" onClick={sendMessage} disabled={isSending || !draft.trim()}>
                  {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Send
                </Button>
              </div>
            </div>
            {pendingProposal && selectedTargetIds.length === 0 && (
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <XCircle className="h-3.5 w-3.5" />
                Select at least one proposal card before applying.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
      <Dialog open={confirmApplyOpen} onOpenChange={setConfirmApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply selected copilot changes?</DialogTitle>
            <DialogDescription>
              This will write {selectedTargetIds.length} selected target{selectedTargetIds.length === 1 ? "" : "s"} to AllCodex.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApplyOpen(false)} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={applySelectedChanges} disabled={isApplying}>
              {isApplying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
