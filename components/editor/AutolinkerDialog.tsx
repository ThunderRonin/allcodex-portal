"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Editor } from "@tiptap/core";
import { Loader2 } from "lucide-react";

interface AutolinkMatch {
  term: string;
  noteId: string;
  title: string;
  selected?: boolean;
}

export function AutolinkerDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<AutolinkMatch[]>([]);
  const [editorRef, setEditorRef] = useState<Editor | null>(null);

  useEffect(() => {
    const handleOpen = async (e: Event) => {
      const customEvent = e as CustomEvent<{ editor: Editor }>;
      const editor = customEvent.detail.editor;
      setEditorRef(editor);
      setOpen(true);
      setLoading(true);
      setMatches([]);

      try {
        const html = editor.getHTML();
        // Use DOM parser to get clean plain text without HTML tags
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const plainText = tempDiv.textContent || "";

        const res = await fetch("/api/lore/autolink", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: plainText }),
        });

        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches.map((m: any) => ({ ...m, selected: true })));
        }
      } catch (err) {
        console.error("Autolinker failed", err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("open-autolink-dialog", handleOpen);
    return () => window.removeEventListener("open-autolink-dialog", handleOpen);
  }, []);

  const handleApply = () => {
    if (!editorRef) return;
    
    const selectedMatches = matches.filter((m) => m.selected);
    if (selectedMatches.length === 0) {
      setOpen(false);
      return;
    }

    // Replace text in the DOM wrapper to preserve other marks and avoid linking inside already-linked text
    const html = editorRef.getHTML();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Helper to walk text nodes and skip A tags
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent || "";

        // Create a wrapper for newly formatted text
        const fragment = document.createDocumentFragment();
        
        // Find all occurrences of all selected terms in this text node
        // Because matches are sorted by length descending on the backend, longer phrases match first
        const occurrences: Array<{ start: number; end: number; term: string; noteId: string }> = [];
        
        for (const match of selectedMatches) {
          const lowerText = text.toLowerCase();
          const lowerTerm = match.term.toLowerCase();
          let pos = 0;
          
          while ((pos = lowerText.indexOf(lowerTerm, pos)) !== -1) {
            // Check if this position is already covered by a longer match
            const isCovered = occurrences.some((occ) => pos >= occ.start && pos < occ.end);
            
            if (!isCovered) {
              // Word boundary check to prevent matching partial words ("king" inside "kingdom" etc is handled by length sort + check,
              // but we also want to avoid linking "king" if it's part of "kingston")
              const isStartBoundary = pos === 0 || /[\s\p{P}]/u.test(text[pos - 1]);
              const endPos = pos + match.term.length;
              const isEndBoundary = endPos === text.length || /[\s\p{P}]/u.test(text[endPos]);

              if (isStartBoundary && isEndBoundary) {
                occurrences.push({ start: pos, end: endPos, term: match.term, noteId: match.noteId });
              }
            }
            pos += match.term.length;
          }
        }

        if (occurrences.length > 0) {
          // Sort occurrences by start position
          occurrences.sort((a, b) => a.start - b.start);
          
          let lastEnd = 0;
          for (const occ of occurrences) {
            // Add preceding text
            if (occ.start > lastEnd) {
              fragment.appendChild(document.createTextNode(text.substring(lastEnd, occ.start)));
            }
            // Add the link
            const a = document.createElement("a");
            
            // Format for novel / tiptap internal representation (and our portal routing)
            a.href = `/lore/${occ.noteId}`;
            // Also append lore-mention class for consistency
            a.className = "lore-mention"; // Optional, standard links in tiptap also work
            
            a.textContent = text.substring(occ.start, occ.end);
            fragment.appendChild(a);
            
            lastEnd = occ.end;
          }
          // Add remaining text
          if (lastEnd < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastEnd)));
          }

          // Replace original text node with our new fragment
          if (node.parentNode) {
            node.parentNode.replaceChild(fragment, node);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip existing links
        if ((node as Element).tagName === "A") {
          return;
        }
        // Recurse down children
        // We have to iterate backwards or copy children because we might replace them
        const children = Array.from(node.childNodes);
        for (const child of children) {
          walkTextNodes(child);
        }
      }
    };

    walkTextNodes(tempDiv);
    
    editorRef.commands.setContent(tempDiv.innerHTML);
    setOpen(false);
  };

  const toggleSelect = (index: number) => {
    const newMatches = [...matches];
    newMatches[index].selected = !newMatches[index].selected;
    setMatches(newMatches);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Autolink Lore Entries</DialogTitle>
          <DialogDescription>
            Scan your document for mentions of existing lore entries and link them automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-y-auto pr-2 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>Scanning lore records...</p>
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No matching unlinked lore entries found in this document.
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, idx) => (
                <div key={idx} className="flex items-start space-x-3 bg-muted/50 p-3 rounded-md border border-border">
                  <Checkbox
                    id={`match-${idx}`}
                    checked={match.selected}
                    onCheckedChange={() => toggleSelect(idx)}
                    className="mt-0.5"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                     <label
                      htmlFor={`match-${idx}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                     >
                        {match.term}
                     </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={loading || matches.length === 0}>
            Apply Autolinks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
