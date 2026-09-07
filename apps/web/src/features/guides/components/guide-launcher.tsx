"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuide } from "@/features/guides/hooks/use-guide";

export function GuideLauncher() {
  const guide = useGuide();
  if (!guide.available) return null;
  return (
    <Button
      data-guide="module-help"
      type="button"
      variant="ghost"
      size="sm"
      onClick={guide.start}
      aria-label="Open module guide"
    >
      <CircleHelp className="h-4 w-4" />
      <span className="hidden sm:inline">Help</span>
    </Button>
  );
}
