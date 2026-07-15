import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center",
        className,
      )}
      role="status"
    >
      {Icon ? (
        <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <h3 className="font-display text-foreground text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
