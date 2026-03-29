"use client";

import { useState, useEffect } from "react";
import { EditorRoot, EditorContent, useEditor } from "novel";
import { handleImageDrop, handleImagePaste } from "novel";
import { defaultExtensions } from "./extensions";
import { AutolinkerDialog } from "./AutolinkerDialog";
import { SlashCommand } from "./slash-command";
import { BubbleMenu } from "./bubble-menu";
import { uploadFn } from "./image-upload";
import { cn } from "@/lib/utils";
import { debounce } from "@/lib/utils";

interface LoreEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  className?: string;
  extensions?: any[];
  showSaveStatus?: boolean;
}

interface TailoredEditorProps {
  content?: string;
  extensions?: any[];
  saveStatus: string;
  setSaveStatus: (status: "Saved" | "Saving..." | "Unsaved") => void;
  onSave?: (html: string) => void;
}

const TailoredEditor = ({ content, extensions, saveStatus, setSaveStatus, onSave }: TailoredEditorProps) => {
  const { editor } = useEditor();
  const [debouncedSave] = useState(() =>
    debounce((html: string) => {
      onSave?.(html);
      setSaveStatus("Saved");
    }, 750)
  );

  useEffect(() => {
    if (editor && content !== undefined && editor.isEmpty) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  return (
    <EditorContent
      immediatelyRender={false}
      extensions={[...defaultExtensions, ...(extensions || [])]}
      className="w-full max-w-none p-4 sm:p-8 pt-14 sm:pt-14 relative z-10"
      editorProps={{
        handleDOMEvents: {
          keydown: () => {
            if (saveStatus === "Saved") setSaveStatus("Unsaved");
            return false;
          },
          // @ts-ignore
          drop: (view, event, _slice, moved) => handleImageDrop(view, event, moved, uploadFn),
          // @ts-ignore
          paste: (view, event, _slice) => handleImagePaste(view, event, uploadFn),
        },
        attributes: {
          class: "novel-editor prose prose-invert prose-p:my-1 prose-headings:my-2 prose-h1:text-primary prose-a:text-primary focus:outline-none max-w-none min-h-[400px] w-full cursor-text",
        },
      }}
      onUpdate={({ editor }) => {
        setSaveStatus("Saving...");
        debouncedSave(editor.getHTML());
      }}
    >
      <SlashCommand />
      <BubbleMenu />
    </EditorContent>
  );
};

export const LoreEditor = ({
  initialContent,
  onSave,
  className,
  extensions = [],
  showSaveStatus = true,
}: LoreEditorProps) => {
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Unsaved">("Saved");
  const [content, setContent] = useState<string | undefined>(initialContent);

  // When initialContent changes from undefined to a string (data loaded), set it once
  useEffect(() => {
    if (initialContent && content === undefined) {
      setContent(initialContent);
    }
  }, [initialContent]);

  return (
    <div 
      className={cn("relative w-full border border-border/80 rounded-xl bg-card/60 shadow-inner group transition-colors hover:border-border overflow-hidden cursor-text", className)}
      onClick={() => {
        const editorDOM = document.querySelector('.ProseMirror') as HTMLElement;
        if (editorDOM) editorDOM.focus();
      }}
    >
      {/* Editor top toolbar hint */}
      <div className="absolute top-0 left-0 right-0 h-10 border-b border-border/40 bg-muted/20 flex items-center px-4 text-xs text-muted-foreground/60 select-none pointer-events-none z-0">
        <span className="font-mono">Type '/' for commands</span>
      </div>

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
      
      <EditorRoot>
        <TailoredEditor
          content={content}
          extensions={extensions}
          saveStatus={saveStatus}
          setSaveStatus={setSaveStatus}
          onSave={onSave}
        />
      </EditorRoot>
      <AutolinkerDialog />
    </div>
  );
};
