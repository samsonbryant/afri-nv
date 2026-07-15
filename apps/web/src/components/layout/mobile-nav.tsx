"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitBranch, LayoutDashboard, Settings, Zap } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { NAV_ITEMS, ROUTES } from "@/lib/constants";
import { useUiStore } from "@/stores/ui-store";

const iconMap = {
  LayoutDashboard,
  GitBranch,
  Zap,
  Settings,
} as const;

export function MobileNav() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-border border-b px-4 py-4 text-left">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo href={ROUTES.dashboard} size="sm" />
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "focus-visible:ring-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
