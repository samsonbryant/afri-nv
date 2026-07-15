import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/config/site";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { icon: "h-7 w-7", text: "text-lg" },
  md: { icon: "h-8 w-8", text: "text-xl" },
  lg: { icon: "h-10 w-10", text: "text-3xl" },
} as const;

export function Logo({ className, showWordmark = true, href = "/", size = "md" }: LogoProps) {
  const sizes = sizeMap[size];

  return (
    <Link
      href={href}
      className={cn(
        "focus-visible:ring-ring inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`${siteConfig.name} home`}
    >
      <span
        className={cn(
          "bg-primary text-primary-foreground relative inline-flex items-center justify-center overflow-hidden rounded-lg shadow-sm",
          sizes.icon,
        )}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="h-[70%] w-[70%]" fill="currentColor">
          <path d="M8 24V8h3.4l6.3 9.3V8H21v16h-3.4l-6.3-9.3V24H8z" />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={cn("font-display text-foreground font-semibold tracking-tight", sizes.text)}
        >
          {siteConfig.name}
        </span>
      ) : null}
    </Link>
  );
}
