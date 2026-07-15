"use client";

import Link from "next/link";
import { GitBranch, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { formatNumber } from "@/lib/utils/format";
import { ROUTES } from "@/lib/constants";

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useDashboardStats();

  const cards = [
    {
      label: "Active workflows",
      value: data?.workflowsActive ?? 0,
      icon: GitBranch,
    },
    {
      label: "Automations running",
      value: data?.automationsRunning ?? 0,
      icon: Zap,
    },
    {
      label: "Runs today",
      value: data?.runsToday ?? 0,
      icon: Sparkles,
    },
    {
      label: "Success rate",
      value: `${data?.successRate ?? 0}%`,
      icon: Sparkles,
      raw: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}`}
        description="Your AI operating system is ready. Orchestrate workflows and automations from one place."
        actions={
          <Button asChild>
            <Link href={ROUTES.workflows}>Open workflows</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="border-border bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">{card.label}</p>
              <card.icon className="text-primary h-4 w-4" aria-hidden />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <p className="font-display mt-3 text-3xl font-semibold tracking-tight">
                {card.raw ? card.value : formatNumber(card.value as number)}
              </p>
            )}
          </div>
        ))}
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-lg font-semibold">Quick start</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={ROUTES.workflows}
            className="border-border bg-card hover:bg-accent/40 focus-visible:ring-ring group rounded-xl border p-5 transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <GitBranch className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-medium">Build a workflow</h3>
                <p className="text-muted-foreground text-sm">
                  Chain agents, approvals, and integrations.
                </p>
              </div>
            </div>
          </Link>
          <Link
            href={ROUTES.automations}
            className="border-border bg-card hover:bg-accent/40 focus-visible:ring-ring group rounded-xl border p-5 transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                <Zap className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-medium">Enable an automation</h3>
                <p className="text-muted-foreground text-sm">
                  Trigger actions from events across your stack.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
