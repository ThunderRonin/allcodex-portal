import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface PortalPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  sectionLabel?: string;
}

export function PortalPageHeader({ title, subtitle, icon: Icon, actions, sectionLabel }: PortalPageHeaderProps) {
  return (
    <div className="px-6 py-5 border-b border-border/30 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 shrink-0">
            <Icon className="h-5 w-5 text-primary/70" />
          </div>
        )}
        <div>
          {sectionLabel && (
            <p
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium mb-0.5"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              {sectionLabel}
            </p>
          )}
          <h1
            className="text-2xl font-bold text-primary"
            style={{
              fontFamily: "var(--font-cinzel)",
              textShadow: "0 0 20px color-mix(in oklab, var(--primary) 40%, transparent)",
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
