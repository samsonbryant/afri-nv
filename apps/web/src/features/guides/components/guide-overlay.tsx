"use client";

import { useEffect, useState } from "react";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function GuideOverlay({ target, onMissing }: { target?: string; onMissing?: () => void }) {
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    let attempts = 0;
    let timer: number | undefined;
    let element: HTMLElement | null = null;

    const measure = () => {
      element = target ? document.querySelector<HTMLElement>(target) : null;
      if (!element) {
        attempts += 1;
        if (attempts < 12) timer = window.setTimeout(measure, 150);
        else onMissing?.();
        return;
      }
      element.scrollIntoView?.({ behavior: "smooth", block: "center" });
      const bounds = element.getBoundingClientRect();
      setRect({
        top: Math.max(8, bounds.top - 6),
        left: Math.max(8, bounds.left - 6),
        width: Math.min(window.innerWidth - 16, bounds.width + 12),
        height: Math.min(window.innerHeight - 16, bounds.height + 12),
      });
    };

    const refresh = () => {
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      setRect({
        top: Math.max(8, bounds.top - 6),
        left: Math.max(8, bounds.left - 6),
        width: Math.min(window.innerWidth - 16, bounds.width + 12),
        height: Math.min(window.innerHeight - 16, bounds.height + 12),
      });
    };

    measure();
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("scroll", refresh, true);
    };
  }, [onMissing, target]);

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/45" aria-hidden />
      {rect ? (
        <div
          className="border-primary pointer-events-none fixed z-[85] rounded-xl border-2 bg-transparent shadow-[0_0_0_4px_hsl(var(--primary)/0.2)] transition-all"
          style={rect}
          aria-hidden
        />
      ) : null}
    </>
  );
}
