"use client";

import { useEffect, useRef, useState } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import {
  useCreateBlockNote,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { filterSuggestionItems } from "@blocknote/core";
import "@blocknote/shadcn/style.css";
import { cn, debounce } from "@/lib/utils";
import {
  loreEditorSchema,
  getMentionMenuItems,
  MentionMenuItem,
  type MentionSuggestion,
} from "./mention";
import { AutolinkerDialog } from "./AutolinkerDialog";

type EditorType = (typeof loreEditorSchema)["BlockNoteEditor"];

interface LoreEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  onChangeImmediate?: (html: string) => void;
  className?: string;
  showSaveStatus?: boolean;
}

const EMPTY_DOCUMENT = [{ type: "paragraph" as const }];

async function uploadImageFile(file: File) {
  if (!file.type.includes("image/")) {
    throw new Error("Only image uploads are supported");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Images must be 10MB or smaller");
  }

  const response = await fetch("/api/lore/upload-image", {
    method: "POST",
    headers: {
      "content-type": file.type || "application/octet-stream",
      "x-vercel-filename": file.name || "image.png",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const data = await response.json();
  return data.url as string;
}

export const LoreEditor = ({
  initialContent,
  onSave,
  onChangeImmediate,
  className,
  showSaveStatus = true,
}: LoreEditorProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
          className,
        )}
      >
        <div className="min-h-[440px] px-6 py-4 text-sm text-muted-foreground">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <MountedLoreEditor
      initialContent={initialContent}
      onSave={onSave}
      onChangeImmediate={onChangeImmediate}
      className={className}
      showSaveStatus={showSaveStatus}
    />
  );
};

const MountedLoreEditor = ({
  initialContent,
  onSave,
  onChangeImmediate,
  className,
  showSaveStatus = true,
}: LoreEditorProps) => {
  const editor = useCreateBlockNote({
    schema: loreEditorSchema,
    uploadFile: uploadImageFile,
  });
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Unsaved">("Saved");
  const [mentionSuggestions, setMentionSuggestions] = useState<MentionSuggestion[]>([]);
  const [mentionRange, setMentionRange] = useState<{ from: number; to: number } | null>(null);
  const appliedContentRef = useRef<string | null>(null);
  const emittedContentRef = useRef<string | null>(null);
  const hydratingRef = useRef(false);
  const mentionRequestRef = useRef(0);
  const mentionRangeRef = useRef<{ from: number; to: number } | null>(null);
  const [debouncedSave] = useState(() =>
    debounce((html: string) => {
      emittedContentRef.current = html;
      onSave?.(html);
      setSaveStatus("Saved");
    }, 750)
  );

  useEffect(() => {
    mentionRangeRef.current = mentionRange;
  }, [mentionRange]);

  const clearMentionSuggestions = () => {
    mentionRequestRef.current += 1;
    setMentionRange(null);
    setMentionSuggestions([]);
  };

  const refreshMentionSuggestions = async () => {
    const { selection, doc } = editor._tiptapEditor.state;

    if (!selection.empty || selection.$from.parent.type.spec.code) {
      clearMentionSuggestions();
      return;
    }

    const cursor = selection.from;
    const blockStart = selection.$from.start();
    const textBeforeCursor = doc.textBetween(blockStart, cursor, "\n", "\0");
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]{2,})$/);

    if (!match) {
      clearMentionSuggestions();
      return;
    }

    const query = match[1];
    const nextRange = {
      from: cursor - query.length - 1,
      to: cursor,
    };

    setMentionRange(nextRange);

    const requestId = ++mentionRequestRef.current;
    const suggestions = await getMentionMenuItems(editor, query);

    if (mentionRequestRef.current !== requestId) {
      return;
    }

    setMentionSuggestions(suggestions);
  };

  const insertMention = (item: MentionSuggestion) => {
    const activeRange = mentionRangeRef.current;

    if (!activeRange) {
      return;
    }

    editor._tiptapEditor.chain().focus().deleteRange(activeRange).run();
    editor.insertInlineContent([
      {
        type: "mention",
        props: {
          noteId: item.noteId,
          title: item.title,
          loreType: item.loreType,
        },
      },
      " ",
    ]);
    clearMentionSuggestions();
  };

  useEffect(() => {
    const nextContent = initialContent ?? "";

    if (
      appliedContentRef.current === nextContent ||
      emittedContentRef.current === nextContent
    ) {
      return;
    }

    hydratingRef.current = true;

    try {
      const blocks = nextContent.trim()
        ? editor.tryParseHTMLToBlocks(nextContent)
        : EMPTY_DOCUMENT;

      editor.replaceBlocks(editor.document, blocks.length > 0 ? blocks : EMPTY_DOCUMENT);
      appliedContentRef.current = nextContent;
      setSaveStatus("Saved");
    } catch {
      editor.replaceBlocks(editor.document, EMPTY_DOCUMENT);
      appliedContentRef.current = "";
      setSaveStatus("Unsaved");
    } finally {
      queueMicrotask(() => {
        hydratingRef.current = false;
      });
    }
  }, [editor, initialContent]);

  return (
    <div 
      className={cn(
        "relative w-full overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:border-border",
        "[&_.bn-container]:min-h-[480px] [&_.bn-container]:bg-transparent [&_.bn-container]:px-0 [&_.bn-container]:py-0",
        "[&_.bn-editor]:min-h-[440px] [&_.bn-editor]:bg-transparent [&_.bn-editor]:px-6 [&_.bn-editor]:pb-8 [&_.bn-editor]:pt-4 [&_.bn-editor]:text-[15px] [&_.bn-editor]:leading-7 [&_.bn-editor]:text-foreground",
        "[&_.bn-editor_[data-content-type='heading']]:font-semibold [&_.bn-editor_a]:text-primary [&_.bn-editor_a]:underline-offset-4",
        "[&_.bn-side-menu]:text-muted-foreground [&_.bn-formatting-toolbar]:border-border/80 [&_.bn-formatting-toolbar]:bg-popover/95",
        className
      )}
      onClick={() => {
        const editorDOM = document.querySelector(".bn-editor") as HTMLElement | null;
        if (editorDOM) editorDOM.focus();
      }}
    >
      {showSaveStatus && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <div
            className={cn("text-xs font-medium px-2 py-1 rounded-full", {
              "bg-muted text-muted-foreground": saveStatus === "Saved",
              "bg-primary/20 text-primary": saveStatus === "Saving...",
              "bg-destructive/20 text-destructive": saveStatus === "Unsaved",
            })}
          >
            {saveStatus}
          </div>
        </div>
      )}

      <BlockNoteView
        editor={editor}
        theme="dark"
        className="w-full"
        slashMenu={false}
        onChange={() => {
          if (hydratingRef.current) {
            return;
          }

          const html = editor.blocksToHTMLLossy(editor.document);
          setSaveStatus("Saving...");
          onChangeImmediate?.(html);
          debouncedSave(html);
          void refreshMentionSuggestions();
        }}
      >
        {/* Custom slash menu with autolinker command */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                {
                  title: "Autolink Lore",
                  onItemClick: () => {
                    window.dispatchEvent(
                      new CustomEvent("open-autolink-dialog", {
                        detail: { editor },
                      })
                    );
                  },
                  aliases: ["autolink", "link", "mention", "scan"],
                  group: "Lore",
                  subtext: "Scan for lore terms and auto-link them",
                },
              ],
              query
            )
          }
        />
      </BlockNoteView>

      {mentionRange && mentionSuggestions.length > 0 && (
        <div className="absolute bottom-6 left-6 z-20 w-full max-w-sm rounded-xl border border-border/80 bg-popover/95 p-2 shadow-2xl backdrop-blur">
          {mentionSuggestions.map((item) => (
            <div key={item.noteId} onMouseDown={(event) => event.preventDefault()}>
              <MentionMenuItem
                item={item}
                isSelected={false}
                onClick={() => insertMention(item)}
              />
            </div>
          ))}
        </div>
      )}

      <AutolinkerDialog />
    </div>
  );
};
