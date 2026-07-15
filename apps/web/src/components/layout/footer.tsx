import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-background border-t">
      <div className="container flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Logo size="sm" />
          <p className="text-muted-foreground max-w-sm text-sm">{siteConfig.description}</p>
        </div>
        <nav
          className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-2 text-sm"
          aria-label="Footer"
        >
          <Link
            href={ROUTES.login}
            className="hover:text-foreground focus-visible:ring-ring transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.register}
            className="hover:text-foreground focus-visible:ring-ring transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            Get started
          </Link>
          <a
            href={siteConfig.links.github}
            className="hover:text-foreground focus-visible:ring-ring transition-colors focus-visible:outline-none focus-visible:ring-2"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
      <div className="border-border border-t py-4">
        <p className="text-muted-foreground container text-center text-xs md:text-left">
          © {year} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
