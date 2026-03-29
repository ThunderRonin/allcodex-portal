import {
  Command,
  EditorCommand,
  EditorCommandEmpty,
  EditorCommandItem,
  EditorCommandList,
  SuggestionItem,
  createSuggestionItems,
} from "novel";
import {
  Heading1,
  Heading2,
  Heading3,
  Text,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  CheckSquare,
  Minus,
  Link2,
} from "lucide-react";
import { ReactNode } from "react";
import { Editor } from "@tiptap/core";
import { uploadFn } from "./image-upload";

// Define a type for out command items
export interface CommandItemProps {
  title: string;
  description: string;
  icon: ReactNode;
  searchTerms?: string[];
  command?: (props: { editor: Editor; range: any }) => void;
}

export const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Just start typing with plain text.",
    searchTerms: ["p", "paragraph"],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "To-do List",
    description: "Track tasks with a to-do list.",
    searchTerms: ["todo", "task", "list", "check", "checkbox"],
    icon: <CheckSquare size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    searchTerms: ["title", "big", "large"],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    searchTerms: ["subtitle", "medium"],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    searchTerms: ["subtitle", "small"],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bulleted list.",
    searchTerms: ["unordered", "point"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    searchTerms: ["ordered"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote.",
    searchTerms: ["blockquote"],
    icon: <Quote size={18} />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").toggleBlockquote().run(),
  },
  {
    title: "Code",
    description: "Capture a code snippet.",
    searchTerms: ["codeblock"],
    icon: <Code size={18} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Image",
    description: "Upload an image from your computer.",
    searchTerms: ["photo", "picture", "media"],
    icon: <ImageIcon size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Create a hidden file input to trigger the OS file picker
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const pos = editor.state.selection.from;
          uploadFn(file, editor.view, pos);
        }
      };
      input.click();
    },
  },
  {
    title: "Divider",
    description: "Visually divide blocks.",
    searchTerms: ["lines", "hr", "horizontal rule"],
    icon: <Minus size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Autolink",
    description: "Find and link mentions of existing lore entries.",
    searchTerms: ["autolink", "link", "connect", "magic"],
    icon: <Link2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Dispatch event to the LoreEditor wrapper to open the dialog
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("open-autolink-dialog", { detail: { editor } })
        );
      }
    },
  },
]);

export const SlashCommand = () => {
  return (
    <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-popover px-1 py-2 shadow-md transition-all text-popover-foreground">
      <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
      <EditorCommandList>
        {suggestionItems.map((item) => (
          <EditorCommandItem
            value={item.title}
            onCommand={(val) => {
              item.command?.(val);
            }}
            className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground `}
            key={item.title}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
              {item.icon}
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </EditorCommandItem>
        ))}
      </EditorCommandList>
    </EditorCommand>
  );
};
