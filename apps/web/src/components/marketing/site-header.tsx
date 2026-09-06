"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { ROUTES } from "@/lib/constants";

const links = [
  { href: ROUTES.home, label: "Home" },
  { href: "/#services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: ROUTES.about, label: "About" },
] as const;

type MarketingHeaderProps = {
  variant?: "default" | "overlay";
};

export function MarketingHeader({ variant = "default" }: MarketingHeaderProps) {
  const pathname = usePathname();
  const overlay = variant === "overlay";
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === ROUTES.about) return pathname === ROUTES.about;
    if (href === ROUTES.home) return pathname === ROUTES.home;
    return false;
  }

  return (
    <header
      className={cn(
        "relative z-20",
        overlay
          ? "absolute inset-x-0 top-0"
          : "border-border/60 bg-background/80 border-b backdrop-blur-md",
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo size="md" light={overlay} href={ROUTES.home} />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Marketing">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  overlay
                    ? active
                      ? "bg-white/15 text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                    : active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant={overlay ? "secondary" : "ghost"}
            asChild
            className={cn(
              "hidden sm:inline-flex",
              overlay && "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            <Link href={ROUTES.login}>Sign in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href={ROUTES.register}>Get started</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "md:hidden",
                  overlay && "text-white hover:bg-white/10 hover:text-white",
                )}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle>Novixa</SheetTitle>
                <SheetDescription>Navigate services, pricing, and account.</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile marketing">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-8 flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link href={ROUTES.login} onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTES.register} onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
