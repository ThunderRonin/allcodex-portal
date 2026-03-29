import {
  TiptapImage,
  TiptapLink,
  UpdatedImage,
  TaskList,
  TaskItem,
  HorizontalRule,
  StarterKit,
  Placeholder,
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension,
} from "novel";

import { mentionExtension } from "./mention-extension";

export const defaultExtensions = [
  StarterKit.configure({
    bulletList: {
      HTMLAttributes: {
        class: "list-disc list-outside leading-3 -mt-2",
      },
    },
    orderedList: {
      HTMLAttributes: {
        class: "list-decimal list-outside leading-3 -mt-2",
      },
    },
    listItem: {
      HTMLAttributes: {
        class: "leading-normal -mb-2",
      },
    },
    blockquote: {
      HTMLAttributes: {
        class: "border-l-4 border-primary align-middle",
      },
    },
    codeBlock: {
      HTMLAttributes: {
        class: "rounded-sm bg-muted border border-border p-4 font-mono font-medium text-muted-foreground",
      },
    },
    code: {
      HTMLAttributes: {
        class: "rounded-md bg-muted px-1.5 py-1 font-mono font-medium text-foreground",
        spellcheck: "false",
      },
    },
    horizontalRule: false, // Use Novel's custom one
    dropcursor: {
      color: "#DBEAFE",
      width: 4,
    },
    gapcursor: false,
  }),
  HorizontalRule.configure({
    HTMLAttributes: {
      class: "grimoire-divider",
    },
  }),
  TiptapLink.configure({
    HTMLAttributes: {
      class: "text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors cursor-pointer",
    },
  }),
  TiptapImage.configure({
    allowBase64: true,
    HTMLAttributes: {
      class: "rounded-lg border border-border",
    },
  }),
  UpdatedImage.configure({
    HTMLAttributes: {
      class: "rounded-lg border border-border",
    },
  }),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }
      return "Press '/' for commands, or '@' to link another lore entry...";
    },
    includeChildren: true,
  }),
  TiptapUnderline,
  TextStyle,
  Color,
  HighlightExtension.configure({
    multicolor: true,
  }),
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2",
    },
  }),
  TaskItem.configure({
    HTMLAttributes: {
      class: "flex items-start my-4",
    },
    nested: true,
  }),
  mentionExtension,
];
