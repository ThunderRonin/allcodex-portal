import { ReactNode } from "react";

interface NarrativeSectionCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export function NarrativeSectionCard({ children, title, className }: NarrativeSectionCardProps) {
  return (
    <div className={`relative overflow-hidden bg-card/40 rounded-none border-l-2 border-primary/50 ${className ?? ""}`}>
      <div className="p-4">
        {title && (
          <p
            className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-medium mb-3"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
