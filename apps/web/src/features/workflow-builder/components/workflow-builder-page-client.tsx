"use client";

import { WorkflowBuilder } from "@/features/workflow-builder/components/workflow-builder";

type WorkflowBuilderPageClientProps = {
  workflowId: string;
};

export function WorkflowBuilderPageClient({ workflowId }: WorkflowBuilderPageClientProps) {
  return <WorkflowBuilder workflowId={workflowId} />;
}
