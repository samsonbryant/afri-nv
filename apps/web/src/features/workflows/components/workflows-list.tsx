"use client";

import { GitBranch, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useWorkflows } from "@/features/workflows/hooks/use-workflows";
import { formatRelative } from "@/lib/utils/format";
import { toast } from "sonner";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  active: "success",
  draft: "secondary",
  paused: "warning",
  archived: "outline",
};

export function WorkflowsList() {
  const { data, isLoading, isError, refetch, isFetching } = useWorkflows();

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Design and run multi-step AI workflows across your operations."
        actions={
          <Button
            onClick={() =>
              toast.message("Create workflow", {
                description: "Workflow builder connects once the API is live.",
              })
            }
          >
            <Plus className="h-4 w-4" aria-hidden />
            New workflow
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading workflows">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="border-border flex items-center justify-between rounded-xl border p-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          icon={GitBranch}
          title="Couldn’t load workflows"
          description="Check your connection and try again."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && data?.results.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No workflows yet"
          description="Create your first workflow to orchestrate agents, approvals, and business processes."
          actionLabel="Create workflow"
          onAction={() =>
            toast.message("Create workflow", {
              description: "Workflow builder connects once the API is live.",
            })
          }
        />
      ) : null}

      {!isLoading && !isError && data && data.results.length > 0 ? (
        <ul className="space-y-3" aria-busy={isFetching}>
          {data.results.map((workflow) => (
            <li
              key={workflow.id}
              className="border-border bg-card hover:bg-accent/30 flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-foreground truncate font-medium">{workflow.name}</h2>
                  <Badge variant={statusVariant[workflow.status] ?? "outline"}>
                    {workflow.status}
                  </Badge>
                </div>
                {workflow.description ? (
                  <p className="text-muted-foreground truncate text-sm">{workflow.description}</p>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  Updated {formatRelative(workflow.updatedAt)}
                </p>
              </div>
              <Button variant="outline" size="sm">
                Open
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
