"use client";

import { createReactInlineContentSpec } from "@blocknote/react";
import { BlockNoteSchema, defaultInlineContentSpecs, defaultBlockSpecs, defaultStyleSpecs } from "@blocknote/core";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// 1. Custom "mention" inline content spec
// ---------------------------------------------------------------------------

export const MentionInlineContent = createReactInlineContentSpec(
  {
    type: "mention" as const,
    propSchema: {
      noteId: { default: "" },
      title: { default: "Unknown" },
      loreType: { default: "" },
    },
    content: "none",
  } as const,
  {
    render: (props) => (
      <a
        href={`/lore/${props.inlineContent.props.noteId}`}
        className="lore-mention inline-flex items-baseline gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-sm font-medium text-primary no-underline hover:bg-primary/25 transition-colors"
        data-note-id={props.inlineContent.props.noteId}
        data-lore-type={props.inlineContent.props.loreType}
        contentEditable={false}
      >
        @{props.inlineContent.props.title}
      </a>
    ),
    // Serialize to clean HTML for storage / ETAPI round-trip
    toExternalHTML: (props) => (
      <a
        href={`/lore/${props.inlineContent.props.noteId}`}
        className="lore-mention"
        data-note-id={props.inlineContent.props.noteId}
        data-lore-type={props.inlineContent.props.loreType}
      >
        {props.inlineContent.props.title}
      </a>
    ),
    // Parse lore-mention links back from HTML into our mention inline content
    parse: (element) => {
      if (
        element.tagName === "A" &&
        (element.classList.contains("lore-mention") || element.hasAttribute("data-note-id"))
      ) {
        return {
          noteId: element.getAttribute("data-note-id") || "",
          title: element.textContent?.replace(/^@/, "") || "Unknown",
          loreType: element.getAttribute("data-lore-type") || "",
        };
      }
      return undefined;
    },
  }
);

// ---------------------------------------------------------------------------
// 2. Editor schema with mention inline content
// ---------------------------------------------------------------------------

export const loreEditorSchema = BlockNoteSchema.create({
  blockSpecs: defaultBlockSpecs,
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    mention: MentionInlineContent,
  },
  styleSpecs: defaultStyleSpecs,
});

export type LoreEditorSchema = typeof loreEditorSchema;

// ---------------------------------------------------------------------------
// 3. Mention suggestion item type
// ---------------------------------------------------------------------------

export interface MentionSuggestion {
  noteId: string;
  title: string;
  loreType: string;
}

// ---------------------------------------------------------------------------
// 4. Mention suggestion menu item adapter
// ---------------------------------------------------------------------------

export function getMentionMenuItems(
  editor: (typeof loreEditorSchema)["BlockNoteEditor"],
  query: string
): Promise<MentionSuggestion[]> {
  if (query.length < 2) return Promise.resolve([]);

  return fetch(`/api/lore/mention-search?q=${encodeURIComponent(query)}`)
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);
}

// ---------------------------------------------------------------------------
// 5. Mention menu item component
// ---------------------------------------------------------------------------

export function MentionMenuItem({
  item,
  isSelected,
  onClick,
}: {
  item: MentionSuggestion;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${
        isSelected
          ? "bg-accent text-accent-foreground"
          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      onClick={onClick}
    >
      <span className="truncate pr-2 font-medium">{item.title}</span>
      <Badge variant="outline" className="text-[10px] leading-none px-1.5 py-0.5">
        {item.loreType}
      </Badge>
    </button>
  );
}
