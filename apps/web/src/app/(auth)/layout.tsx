import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { siteConfig } from "@/config/site";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background relative min-h-screen">
      <div className="bg-teal-glow pointer-events-none absolute inset-0 opacity-80" aria-hidden />
      <div
        className="bg-grid-pattern pointer-events-none absolute inset-0 bg-[size:40px_40px] opacity-30 dark:opacity-15"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="container flex h-16 items-center justify-between">
          <Logo />
          <ThemeToggle />
        </header>

        <main className="container flex flex-1 items-center justify-center py-10">
          <div className="border-border/80 bg-card/90 w-full max-w-md rounded-2xl border p-6 shadow-sm backdrop-blur sm:p-8">
            {children}
          </div>
        </main>

        <footer className="text-muted-foreground container py-6 text-center text-xs">
          <Link
            href="/"
            className="focus-visible:ring-ring underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2"
          >
            Back to {siteConfig.name}
          </Link>
        </footer>
      </div>
    </div>
  );
}
