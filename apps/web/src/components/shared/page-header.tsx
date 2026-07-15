import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-display text-foreground text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
