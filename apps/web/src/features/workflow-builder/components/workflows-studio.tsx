"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  useCreateWorkflow,
  useWorkflowList,
} from "@/features/workflow-builder/hooks/use-workflow-builder";
import { formatRelative } from "@/lib/utils/format";
import { ROUTES } from "@/lib/constants";

const statusVariant: Record<string, "default" | "secondary" | "success" | "warning" | "outline"> = {
  active: "success",
  draft: "secondary",
  paused: "warning",
  archived: "outline",
};

export function WorkflowsStudio() {
  const router = useRouter();
  const { data = [], isLoading, isError, refetch, isFetching } = useWorkflowList();
  const createWorkflow = useCreateWorkflow();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div>
      <PageHeader
        title="Workflows"
        description="Design and run multi-step AI workflows across your operations."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New workflow
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full rounded-xl" />
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

      {!isLoading && !isError && data.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No workflows yet"
          description="Create your first workflow to orchestrate agents, approvals, and business processes."
          actionLabel="Create workflow"
          onAction={() => setOpen(true)}
        />
      ) : null}

      {!isLoading && !isError && data.length > 0 ? (
        <ul className="space-y-3" aria-busy={isFetching}>
          {data.map((workflow) => (
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
                  Updated {formatRelative(workflow.updatedAt)} · {workflow.definition.nodes.length}{" "}
                  nodes
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.workflowBuilder(workflow.id)}>Open builder</Link>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workflow</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="wf-name">Name</Label>
              <Input
                id="wf-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Lead enrichment"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wf-desc">Description</Label>
              <Input
                id="wf-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || createWorkflow.isPending}
              onClick={() => {
                createWorkflow.mutate(
                  {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    status: "draft",
                  },
                  {
                    onSuccess: (workflow) => {
                      setOpen(false);
                      setName("");
                      setDescription("");
                      router.push(ROUTES.workflowBuilder(workflow.id));
                    },
                  },
                );
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
