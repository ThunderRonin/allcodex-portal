"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  Brain,
  Search,
  LayoutDashboard,
  ShieldAlert,
  Network,
  Microscope,
  Settings,
  Swords,
  MapPin,
  CalendarDays,
  BookMarked,
  Upload,
  Scroll,
  Sparkles,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Chronicle",
    items: [
      { href: "/", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/lore", icon: BookOpen, label: "Lore Browser" },
      { href: "/search", icon: Search, label: "Search" },
    ],
  },
  {
    label: "Studio",
    items: [
      { href: "/brain-dump", icon: Brain, label: "Brain Dump" },
    ],
  },
  {
    label: "Session",
    items: [
      { href: "/session", icon: Swords, label: "Session Workspace" },
      { href: "/quests", icon: MapPin, label: "Quests & Hooks" },
      { href: "/timeline", icon: CalendarDays, label: "Timeline" },
      { href: "/statblocks", icon: BookMarked, label: "Statblock Library" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { href: "/ai/consistency", icon: ShieldAlert, label: "Consistency" },
      { href: "/ai/relationships", icon: Network, label: "Relationships" },
      { href: "/ai/gaps", icon: Microscope, label: "Gap Detector" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/import", icon: Upload, label: "Import" },
      { href: "/shared", icon: Globe, label: "Shared Content" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Scroll className="h-5 w-5 text-primary" />
          <span className="font-bold text-primary tracking-wider text-sm uppercase" style={{ fontFamily: "var(--font-cinzel)" }}>
            AllCodex
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 pl-7">Lore Chronicle</p>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-4 py-2">
        <p className="text-xs text-muted-foreground opacity-50 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by AllKnower
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
