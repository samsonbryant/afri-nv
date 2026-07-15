import type { Edge, Node } from "@xyflow/react";

export type WorkflowNodeKind = "trigger" | "condition" | "action";

export type WorkflowNodeData = {
  label: string;
  kind: WorkflowNodeKind;
  subtype: string;
  description?: string;
};

export type WorkflowFlowNode = Node<WorkflowNodeData>;
export type WorkflowFlowEdge = Edge;

export type WorkflowDefinition = {
  version: number;
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
};

export type WorkflowDetail = {
  id: string;
  name: string;
  description?: string | null;
  status: "draft" | "active" | "paused" | "archived";
  definition: WorkflowDefinition;
  updatedAt: string;
  createdAt: string;
};

export type PaletteItem = {
  kind: WorkflowNodeKind;
  subtype: string;
  label: string;
  description: string;
};

export type ValidateResult = {
  valid: boolean;
  errors: string[];
};

export type PublishResult = {
  id: string;
  status: string;
  message?: string;
};

export type RunResult = {
  id: string;
  status: string;
  message?: string;
};

export const NODE_PALETTE: PaletteItem[] = [
  {
    kind: "trigger",
    subtype: "manual",
    label: "Manual trigger",
    description: "Start when a user runs the workflow",
  },
  {
    kind: "trigger",
    subtype: "schedule",
    label: "Schedule",
    description: "Run on a cron or interval",
  },
  {
    kind: "trigger",
    subtype: "webhook",
    label: "Webhook",
    description: "Start from an HTTP webhook",
  },
  {
    kind: "condition",
    subtype: "if",
    label: "If / else",
    description: "Branch based on a condition",
  },
  {
    kind: "condition",
    subtype: "filter",
    label: "Filter",
    description: "Continue only when criteria match",
  },
  {
    kind: "action",
    subtype: "ai",
    label: "AI action",
    description: "Call an AI agent or prompt",
  },
  {
    kind: "action",
    subtype: "email",
    label: "Send email",
    description: "Notify a user or list",
  },
  {
    kind: "action",
    subtype: "http",
    label: "HTTP request",
    description: "Call an external API",
  },
  {
    kind: "action",
    subtype: "crm",
    label: "Update CRM",
    description: "Create or update a CRM record",
  },
];

export function emptyDefinition(): WorkflowDefinition {
  return {
    version: 1,
    nodes: [
      {
        id: "trigger-1",
        type: "workflow",
        position: { x: 120, y: 160 },
        data: {
          label: "Manual trigger",
          kind: "trigger",
          subtype: "manual",
          description: "Start when a user runs the workflow",
        },
      },
    ],
    edges: [],
  };
}
