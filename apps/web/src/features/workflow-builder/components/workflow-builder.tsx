"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, CheckCircle2, Play, Rocket, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { WorkflowNode } from "@/features/workflow-builder/components/workflow-node";
import { NodePalette } from "@/features/workflow-builder/components/node-palette";
import {
  usePublishWorkflow,
  useRunWorkflow,
  useSaveDefinition,
  useValidateWorkflow,
  useWorkflowDetail,
} from "@/features/workflow-builder/hooks/use-workflow-builder";
import type {
  PaletteItem,
  WorkflowDefinition,
  WorkflowFlowEdge,
  WorkflowFlowNode,
} from "@/features/workflow-builder/types";
import { ROUTES } from "@/lib/constants";
import { GitBranch } from "lucide-react";

const nodeTypes: NodeTypes = {
  workflow: WorkflowNode,
};

type WorkflowBuilderProps = {
  workflowId: string;
};

export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const { data, isLoading, isError, refetch } = useWorkflowDetail(workflowId);
  const saveDefinition = useSaveDefinition(workflowId);
  const validate = useValidateWorkflow(workflowId);
  const publish = usePublishWorkflow(workflowId);
  const run = useRunWorkflow(workflowId);

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowFlowEdge>([]);

  useEffect(() => {
    if (data?.definition) {
      setNodes(data.definition.nodes);
      setEdges(data.definition.edges);
    }
  }, [data, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    [setEdges],
  );

  const currentDefinition = useMemo<WorkflowDefinition>(
    () => ({
      version: data?.definition.version ?? 1,
      nodes,
      edges,
    }),
    [data?.definition.version, nodes, edges],
  );

  const handleAdd = useCallback(
    (item: PaletteItem) => {
      const id = `${item.kind}-${Date.now()}`;
      const node: WorkflowFlowNode = {
        id,
        type: "workflow",
        position: {
          x: 120 + (nodes.length % 4) * 200,
          y: 80 + Math.floor(nodes.length / 4) * 120,
        },
        data: {
          label: item.label,
          kind: item.kind,
          subtype: item.subtype,
          description: item.description,
        },
      };
      setNodes((prev) => [...prev, node]);
    },
    [nodes.length, setNodes],
  );

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[560px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <EmptyState
        icon={GitBranch}
        title="Workflow not found"
        description="This workflow may have been deleted or you don’t have access."
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  return (
    <ReactFlowProvider>
      <div className="-mx-4 -mb-6 flex h-[calc(100vh-7rem)] flex-col md:-mx-6">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={ROUTES.workflows} aria-label="Back to workflows">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display truncate text-lg font-semibold">{data.name}</h1>
                <Badge variant="secondary">{data.status}</Badge>
              </div>
              {data.description ? (
                <p className="text-muted-foreground truncate text-xs">{data.description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={saveDefinition.isPending}
              onClick={() => saveDefinition.mutate(currentDefinition)}
            >
              <Save className="h-4 w-4" aria-hidden />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={validate.isPending}
              onClick={() => validate.mutate(currentDefinition)}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Validate
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={publish.isPending}
              onClick={() => publish.mutate()}
            >
              <Rocket className="h-4 w-4" aria-hidden />
              Publish
            </Button>
            <Button size="sm" disabled={run.isPending} onClick={() => run.mutate()}>
              <Play className="h-4 w-4" aria-hidden />
              Run
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          <NodePalette onAdd={handleAdd} />
          <div className="bg-muted/20 min-w-0 flex-1">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={18} size={1} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
