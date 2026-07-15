import type { Workflow } from "@/types/api";

export type WorkflowListItem = Workflow;

export type WorkflowFilters = {
  status?: Workflow["status"];
  search?: string;
};
