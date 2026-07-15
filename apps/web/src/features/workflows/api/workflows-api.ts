import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PaginatedResponse, Workflow } from "@/types/api";
import type { CreateWorkflowInput } from "@/lib/validations/workflow";

export async function fetchWorkflows(): Promise<PaginatedResponse<Workflow>> {
  return api.get<PaginatedResponse<Workflow>>(API_ENDPOINTS.workflows.list);
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  return api.get<Workflow>(API_ENDPOINTS.workflows.detail(id));
}

export async function createWorkflow(input: CreateWorkflowInput): Promise<Workflow> {
  return api.post<Workflow>(API_ENDPOINTS.workflows.create, input);
}

export async function deleteWorkflow(id: string): Promise<void> {
  return api.delete(API_ENDPOINTS.workflows.delete(id));
}
