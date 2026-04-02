"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({
  contentRef,
}: {
  contentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Build entries by scanning the content element for headings
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    // MutationObserver to catch late-rendered content
    const build = () => {
      const headings = Array.from(el.querySelectorAll("h1, h2, h3, h4"));
      if (headings.length < 2) {
        setEntries([]);
        return;
      }
      const toc: TocEntry[] = headings.map((h, i) => {
        if (!h.id) h.id = `toc-heading-${i}`;
        return {
          id: h.id,
          text: h.textContent?.trim() ?? "",
          level: parseInt(h.tagName[1]),
        };
      });
      setEntries(toc);
    };

    build();
    const mo = new MutationObserver(build);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [contentRef]);

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    observerRef.current?.disconnect();
    if (entries.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (obs) => {
        const visible = obs.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0.1 },
    );

    entries.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [entries]);

  if (entries.length < 2) return null;

  return (
    <div className="space-y-0.5">
      <p
        className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        Contents
      </p>
      {entries.map(({ id, text, level }) => (
        <button
          key={id}
          onClick={() =>
            document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
          }
          className={cn(
            "block w-full text-left text-xs leading-snug py-0.5 transition-colors truncate rounded",
            level === 1 ? "pl-0" : level === 2 ? "pl-2" : level === 3 ? "pl-4" : "pl-6",
            activeId === id
              ? "text-primary font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}
