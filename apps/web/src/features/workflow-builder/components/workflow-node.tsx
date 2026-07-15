"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils/cn";
import type { WorkflowNodeData } from "@/features/workflow-builder/types";

const kindStyles: Record<WorkflowNodeData["kind"], string> = {
  trigger: "border-teal-500/50 bg-teal-500/10",
  condition: "border-amber-500/50 bg-amber-500/10",
  action: "border-slate-400/60 bg-slate-500/10",
};

function WorkflowNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  return (
    <div
      className={cn(
        "min-w-[180px] rounded-lg border px-3 py-2 shadow-sm",
        kindStyles[nodeData.kind],
        selected && "ring-primary ring-2",
      )}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      <p className="text-muted-foreground text-[10px] uppercase tracking-wide">{nodeData.kind}</p>
      <p className="text-foreground text-sm font-medium">{nodeData.label}</p>
      {nodeData.description ? (
        <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{nodeData.description}</p>
      ) : null}
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);
