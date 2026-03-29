import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import tippy, { Instance } from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface MentionSuggestion {
  noteId: string;
  title: string;
  loreType: string;
}

const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.noteId, label: item.title });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }
      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }
      if (event.key === "Enter") {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="z-50 flex w-64 flex-col overflow-hidden rounded-md border border-muted bg-popover p-1 shadow-md">
      {props.items.length ? (
        props.items.map((item: MentionSuggestion, index: number) => (
          <button
            key={index}
            className={`flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none transition-colors ${
              index === selectedIndex ? "bg-accent text-accent-foreground" : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => selectItem(index)}
          >
            <span className="truncate pr-2 font-medium">{item.title}</span>
            <Badge variant="outline" className="text-[10px] leading-none px-1.5 py-0.5">
              {item.loreType}
            </Badge>
          </button>
        ))
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No matches found</div>
      )}
    </div>
  );
});

MentionList.displayName = "MentionList";

export const mentionExtension = Mention.configure({
  HTMLAttributes: {
    class: "lore-mention",
  },
  renderLabel({ options, node }) {
    // When rendered we don't strictly need the @ character if we use CSS to prefix,
    // but default tiptap shows it
    return `${node.attrs.label ?? node.attrs.id}`;
  },
  suggestion: {
    char: "@",
    items: async ({ query }): Promise<MentionSuggestion[]> => {
      if (query.length < 2) return [];
      const res = await fetch(`/api/lore/mention-search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return res.json();
    },
    render: () => {
      let reactRenderer: ReactRenderer;
      let popup: Instance[];

      return {
        onStart: (props) => {
          if (!props.clientRect) return;
          reactRenderer = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as any,
            appendTo: () => document.body,
            content: reactRenderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
          });
        },
        onUpdate(props) {
          reactRenderer.updateProps(props);
          if (!props.clientRect) return;
          popup?.[0]?.setProps({
            getReferenceClientRect: props.clientRect as any,
          });
        },
        onKeyDown(props) {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }
          return (reactRenderer.ref as any)?.onKeyDown(props);
        },
        onExit() {
          popup?.[0]?.destroy();
          reactRenderer?.destroy();
        },
      };
    },
  },
});
