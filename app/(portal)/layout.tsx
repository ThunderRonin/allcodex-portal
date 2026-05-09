import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/portal/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Scroll } from "lucide-react";
import { ThemeToggle } from "@/components/portal/ThemeToggle";
import { CopilotProvider } from "@/components/portal/CopilotProvider";
import { CommandPalette } from "@/components/portal/CommandPalette";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-13 shrink-0 items-center gap-3 border-b border-border/40 px-4 bg-card/30">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4 bg-border/60" />
          <div className="flex items-center gap-2">
            <Scroll className="h-4 w-4 text-primary/70" />
            <span
              className="text-xs font-semibold text-primary tracking-[0.2em] uppercase"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              All Reach Chronicle
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <CopilotProvider>
            {children}
            <CommandPalette />
          </CopilotProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
