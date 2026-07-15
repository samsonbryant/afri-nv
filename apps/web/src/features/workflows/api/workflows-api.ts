import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import type { PaginatedResponse, Workflow } from "@/types/api";
import type { CreateWorkflowInput } from "@/lib/validations/workflow";

function mapWorkflow(raw: Record<string, unknown>): Workflow {
  const status = String(raw.status ?? "draft").toLowerCase();
  const allowed: Workflow["status"][] = ["draft", "active", "paused", "archived"];
  return {
    id: String(raw.id),
    name: pickString(raw, "name") || "Untitled workflow",
    description: pickString(raw, "description") || null,
    status: (allowed.includes(status as Workflow["status"])
      ? status
      : "draft") as Workflow["status"],
    createdAt: pickIso(raw, "created_at", "createdAt"),
    updatedAt: pickIso(raw, "updated_at", "updatedAt"),
    runCount: typeof raw.run_count === "number" ? raw.run_count : undefined,
  };
}

function asPage(items: Workflow[]): PaginatedResponse<Workflow> {
  return { count: items.length, next: null, previous: null, results: items };
}

export async function fetchWorkflows(
  organizationId?: string | null,
): Promise<PaginatedResponse<Workflow>> {
  if (!organizationId) return asPage([]);
  const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.workflows.list, organizationId));
  const items = unwrapList(payload as Workflow[] | { results?: Workflow[] }).map((item) =>
    mapWorkflow(item as unknown as Record<string, unknown>),
  );
  return asPage(items);
}

export async function fetchWorkflow(id: string, organizationId?: string | null): Promise<Workflow> {
  const raw = await api.get<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.workflows.detail(id), organizationId),
  );
  return mapWorkflow(raw);
}

export async function createWorkflow(
  input: CreateWorkflowInput & { organizationId?: string | null },
): Promise<Workflow> {
  const organizationId = input.organizationId;
  if (!organizationId) {
    throw new Error("organization_id is required to create a workflow");
  }
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.workflows.create, {
    organization_id: organizationId,
    name: input.name,
    description: input.description ?? "",
    status: input.status ?? "draft",
  });
  return mapWorkflow(raw);
}

export async function deleteWorkflow(id: string, organizationId?: string | null): Promise<void> {
  await api.delete(withOrg(API_ENDPOINTS.workflows.delete(id), organizationId));
}
