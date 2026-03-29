import { EditorBubble, useEditor } from "novel";
import { Bold, Italic, Underline, Strikethrough, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const BubbleMenu = () => {
  const { editor } = useEditor();

  if (!editor) return null;

  return (
    <EditorBubble
      tippyOptions={{
        placement: "top",
        animation: "shift-away",
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-popover shadow-xl"
    >
      <div className="flex bg-popover text-popover-foreground">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 rounded-none", {
            "bg-accent text-accent-foreground": editor.isActive("bold"),
          })}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 rounded-none", {
            "bg-accent text-accent-foreground": editor.isActive("italic"),
          })}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 rounded-none", {
            "bg-accent text-accent-foreground": editor.isActive("underline"),
          })}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 rounded-none", {
            "bg-accent text-accent-foreground": editor.isActive("strike"),
          })}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 w-8 p-0 rounded-none", {
            "bg-accent text-accent-foreground": editor.isActive("code"),
          })}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code className="h-4 w-4" />
        </Button>
      </div>
    </EditorBubble>
  );
};
