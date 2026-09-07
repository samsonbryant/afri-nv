"use client";

import { Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomations } from "@/features/automations/hooks/use-automations";
import { ROUTES } from "@/lib/constants";
import { formatRelative } from "@/lib/utils/format";

export function AutomationsList() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useAutomations();

  function openBuilder(automationId?: string) {
    if (automationId) {
      router.push(ROUTES.workflowBuilder(automationId));
      return;
    }
    router.push(ROUTES.workflows);
  }

  return (
    <div>
      <PageHeader
        title="Automations"
        description="Event-driven runs and workflow automations that keep your business moving in realtime."
        actions={
          <Button onClick={() => openBuilder()}>
            <Plus className="h-4 w-4" aria-hidden />
            New automation
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading automations">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          icon={Zap}
          title="Couldn’t load automations"
          description="Something went wrong while fetching automations."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && data?.results.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          description="Build a workflow to connect triggers to actions so routine work runs without you."
          actionLabel="Open workflows"
          onAction={() => openBuilder()}
        />
      ) : null}

      {!isLoading && !isError && data && data.results.length > 0 ? (
        <ul className="space-y-3">
          {data.results.map((automation) => (
            <li
              key={automation.id}
              className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{automation.name}</h2>
                  <Badge variant={automation.enabled ? "success" : "secondary"}>
                    {automation.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">Trigger: {automation.triggerType}</p>
                <p className="text-muted-foreground text-xs">
                  Updated {formatRelative(automation.updatedAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => openBuilder(automation.workflowId || automation.id)}
              >
                Configure
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
