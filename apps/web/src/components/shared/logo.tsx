import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { siteConfig } from "@/config/site";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Invert wordmark for dark hero/footer backgrounds */
  light?: boolean;
};

const sizeMap = {
  sm: { icon: 28, text: "text-lg" },
  md: { icon: 36, text: "text-xl" },
  lg: { icon: 48, text: "text-3xl" },
} as const;

export function Logo({
  className,
  showWordmark = true,
  href = "/",
  size = "md",
  light = false,
}: LogoProps) {
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
      <Image
        src={light ? "/novixa_logo_light.png" : "/novixa_logo.png"}
        alt=""
        width={sizes.icon}
        height={sizes.icon}
        className="h-auto w-auto object-contain"
        priority
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-display font-semibold tracking-tight",
            light ? "text-white" : "text-foreground",
            sizes.text,
          )}
        >
          {siteConfig.name}
        </span>
      ) : null}
    </Link>
  );
}
