"use client";

import { create } from "zustand";
import type {
  WorkflowDefinition,
  WorkflowFlowEdge,
  WorkflowFlowNode,
} from "@/features/workflow-builder/types";
import { emptyDefinition } from "@/features/workflow-builder/types";

type WorkflowBuilderStore = {
  nodes: WorkflowFlowNode[];
  edges: WorkflowFlowEdge[];
  setGraph: (definition: WorkflowDefinition) => void;
  setNodes: (nodes: WorkflowFlowNode[]) => void;
  setEdges: (edges: WorkflowFlowEdge[]) => void;
  reset: () => void;
};

const initial = emptyDefinition();

export const useWorkflowBuilderStore = create<WorkflowBuilderStore>((set) => ({
  nodes: initial.nodes,
  edges: initial.edges,
  setGraph: (definition) => set({ nodes: definition.nodes, edges: definition.edges }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  reset: () => {
    const def = emptyDefinition();
    set({ nodes: def.nodes, edges: def.edges });
  },
}));
