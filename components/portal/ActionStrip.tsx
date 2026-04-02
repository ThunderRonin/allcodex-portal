import { ReactNode } from "react";

interface ActionStripProps {
  children: ReactNode;
  position?: "top" | "bottom";
  className?: string;
}

export function ActionStrip({ children, position = "bottom", className }: ActionStripProps) {
  const borderClass = position === "top" ? "border-b border-border/30" : "border-t border-border/30";
  return (
    <div className={`bg-card/50 ${borderClass} px-6 py-3 flex items-center gap-3 ${className ?? ""}`}>
      {children}
    </div>
  );
}
