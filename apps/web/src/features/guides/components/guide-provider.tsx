"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { findGuide } from "@/features/guides/guide-registry";
import { GuideContext } from "@/features/guides/hooks/use-guide";
import { useGuideStore } from "@/features/guides/stores/guide-store";
import { GuideOverlay } from "@/features/guides/components/guide-overlay";

export function GuideProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userId = useAuthStore((state) => state.user?.id ?? "guest");
  const organizationId = useAuthStore((state) => state.organization?.id ?? "none");
  const guide = useMemo(() => findGuide(pathname), [pathname]);
  const completed = useGuideStore((state) => state.completed);
  const setProgress = useGuideStore((state) => state.setProgress);
  const markCompleted = useGuideStore((state) => state.markCompleted);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const completionKey = guide ? `${userId}:${organizationId}:${guide.id}` : "";
  const start = useCallback(() => {
    if (!guide) return;
    setStepIndex(0);
    setActive(true);
  }, [guide]);
  const close = useCallback(() => setActive(false), []);

  useEffect(() => {
    setActive(false);
    const saved = completionKey ? useGuideStore.getState().progress[completionKey] : undefined;
    setStepIndex(saved && saved.version === guide?.version ? saved.step : 0);
    if (!guide || !completionKey || completed[completionKey] >= guide.version) return;
    const timer = window.setTimeout(() => setActive(true), 700);
    return () => window.clearTimeout(timer);
  }, [completionKey, completed, guide]);

  useEffect(() => {
    if (!active || !guide || !completionKey) return;
    setProgress(completionKey, guide.version, stepIndex);
  }, [active, completionKey, guide, setProgress, stepIndex]);

  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(false);
      if (event.key === "ArrowRight") setStepIndex((value) => value + 1);
      if (event.key === "ArrowLeft") setStepIndex((value) => Math.max(0, value - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const finish = useCallback(() => {
    if (guide && completionKey) markCompleted(completionKey, guide.version);
    setActive(false);
  }, [completionKey, guide, markCompleted]);

  const currentStep = guide?.steps[Math.min(stepIndex, (guide?.steps.length ?? 1) - 1)];
  const isLast = Boolean(guide && stepIndex >= guide.steps.length - 1);
  const handleMissingTarget = useCallback(() => {
    if (!currentStep?.optional || !guide) return;
    if (stepIndex >= guide.steps.length - 1) finish();
    else setStepIndex((value) => value + 1);
  }, [currentStep?.optional, finish, guide, stepIndex]);
  const placementClass =
    currentStep?.placement === "top"
      ? "top-4 left-1/2 -translate-x-1/2"
      : currentStep?.placement === "left"
        ? "left-4 top-1/2 -translate-y-1/2"
        : currentStep?.placement === "right"
          ? "right-4 top-1/2 -translate-y-1/2"
          : "bottom-4 right-4";

  return (
    <GuideContext.Provider value={{ available: Boolean(guide), active, start, close }}>
      {children}
      {active && guide && currentStep ? (
        <>
          <GuideOverlay target={currentStep.target} onMissing={handleMissingTarget} />
          <section
            className={`border-border bg-card fixed z-[90] w-[calc(100%-2rem)] max-w-sm rounded-2xl border p-5 shadow-2xl ${placementClass}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${guide.title} guide`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-primary text-xs font-semibold uppercase tracking-wide">
                  {guide.title} · {stepIndex + 1} of {guide.steps.length}
                </p>
                <h2 className="font-display mt-1 text-lg font-semibold">{currentStep.title}</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={close} aria-label="Close guide">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-sm leading-6">{currentStep.body}</p>
            <div className="mt-5 flex items-center justify-between gap-2">
              <Button variant="ghost" size="sm" onClick={finish}>
                Skip
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={stepIndex === 0}
                  onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (isLast) finish();
                    else setStepIndex((value) => value + 1);
                  }}
                >
                  {isLast ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </GuideContext.Provider>
  );
}
