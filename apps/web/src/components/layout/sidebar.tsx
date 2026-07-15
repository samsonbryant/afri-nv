"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GitBranch,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS, ROUTES } from "@/lib/constants";
import { useUiStore } from "@/stores/ui-store";

const iconMap = {
  LayoutDashboard,
  GitBranch,
  Zap,
  Settings,
} as const;

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUiStore();

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar text-sidebar-foreground hidden h-screen flex-col border-r transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[72px]" : "w-64",
      )}
      aria-label="Main navigation"
    >
      <div
        className={cn(
          "flex h-16 items-center px-4",
          sidebarCollapsed ? "justify-center" : "justify-between",
        )}
      >
        <Logo showWordmark={!sidebarCollapsed} href={ROUTES.dashboard} size="sm" />
        {!sidebarCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
            aria-label="Collapse sidebar"
            className="h-8 w-8"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {sidebarCollapsed ? (
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
            aria-label="Expand sidebar"
            className="h-8 w-8"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      <Separator className="bg-sidebar-border" />

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Sidebar">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "focus-visible:ring-ring group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                sidebarCollapsed && "justify-center px-2",
              )}
              aria-current={active ? "page" : undefined}
              title={sidebarCollapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!sidebarCollapsed ? <span>{item.title}</span> : null}
            </Link>
          );
        })}
      </nav>

      {!sidebarCollapsed ? (
        <div className="border-sidebar-border border-t p-4">
          <p className="text-muted-foreground text-xs">AI Business Operating System</p>
        </div>
      ) : null}
    </aside>
  );
}
