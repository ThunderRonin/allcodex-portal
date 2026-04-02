"use client";

/**
 * PreviewToggle — switches the lore detail view between GM mode (full content)
 * and Player mode (content with .gm-only elements hidden).
 */

import { Button } from "@/components/ui/button";
import { Eye, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewMode = "gm" | "player";

interface PreviewToggleProps {
  mode: PreviewMode;
  onChange: (mode: PreviewMode) => void;
}

export function PreviewToggle({ mode, onChange }: PreviewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/20 p-0.5">
      <Button
        size="sm"
        variant={mode === "gm" ? "default" : "ghost"}
        className={cn("h-7 gap-1.5 text-xs px-2.5", mode === "gm" && "shadow-sm")}
        onClick={() => onChange("gm")}
      >
        <Shield className="h-3.5 w-3.5" />
        GM
      </Button>
      <Button
        size="sm"
        variant={mode === "player" ? "default" : "ghost"}
        className={cn("h-7 gap-1.5 text-xs px-2.5", mode === "player" && "shadow-sm")}
        onClick={() => onChange("player")}
      >
        <Eye className="h-3.5 w-3.5" />
        Player
      </Button>
    </div>
  );
}
