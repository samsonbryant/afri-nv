import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { siteConfig } from "@/config/site";
import { ROUTES } from "@/lib/constants";

const footerLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#pricing", label: "Pricing" },
  { href: ROUTES.about, label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refunds" },
  { href: ROUTES.login, label: "Sign in" },
  { href: ROUTES.register, label: "Start free" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border/60 relative overflow-hidden border-t">
      <div className="bg-brand-glow pointer-events-none absolute inset-0 opacity-50" aria-hidden />
      <div className="container relative flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo size="md" />
          <p className="text-muted-foreground text-sm leading-relaxed">{siteConfig.description}</p>
        </div>
        <nav
          className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-sm"
          aria-label="Footer"
        >
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground focus-visible:ring-ring transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-border/50 relative border-t">
        <p className="text-muted-foreground container py-4 text-xs">
          © {year} {siteConfig.name} · Built in Liberia · Founded by Samson Bryant
        </p>
      </div>
    </footer>
  );
}
