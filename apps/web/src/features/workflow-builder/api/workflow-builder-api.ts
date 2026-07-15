import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type { CreateWorkflowInput } from "@/lib/validations/workflow";
import type {
  PublishResult,
  RunResult,
  ValidateResult,
  WorkflowDefinition,
  WorkflowDetail,
} from "@/features/workflow-builder/types";
import { emptyDefinition } from "@/features/workflow-builder/types";

const now = Date.now();

let demoWorkflows: WorkflowDetail[] = [
  {
    id: "wf-demo-1",
    name: "Lead enrichment",
    description: "Enrich CRM leads and notify sales",
    status: "draft",
    definition: emptyDefinition(),
    createdAt: new Date(now - 86400000 * 3).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString(),
  },
  {
    id: "wf-demo-2",
    name: "Support triage",
    description: "Classify tickets and draft replies",
    status: "active",
    definition: {
      ...emptyDefinition(),
      nodes: [
        {
          id: "trigger-1",
          type: "workflow",
          position: { x: 80, y: 120 },
          data: {
            label: "Webhook",
            kind: "trigger",
            subtype: "webhook",
            description: "New support ticket",
          },
        },
        {
          id: "action-1",
          type: "workflow",
          position: { x: 360, y: 120 },
          data: {
            label: "AI action",
            kind: "action",
            subtype: "ai",
            description: "Classify urgency",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "trigger-1",
          target: "action-1",
        },
      ],
    },
    createdAt: new Date(now - 86400000 * 10).toISOString(),
    updatedAt: new Date(now - 86400000).toISOString(),
  },
];

function parseDefinition(raw: unknown): WorkflowDefinition {
  if (raw && typeof raw === "object" && Array.isArray((raw as WorkflowDefinition).nodes)) {
    const def = raw as WorkflowDefinition;
    return {
      version: typeof def.version === "number" ? def.version : 1,
      nodes: def.nodes,
      edges: Array.isArray(def.edges) ? def.edges : [],
    };
  }
  return emptyDefinition();
}

function mapWorkflow(raw: Record<string, unknown>): WorkflowDetail {
  const statusRaw = pickString(raw, "status") || "draft";
  const status =
    statusRaw === "active" ||
    statusRaw === "paused" ||
    statusRaw === "archived" ||
    statusRaw === "draft"
      ? statusRaw
      : "draft";
  return {
    id: String(raw.id),
    name: pickString(raw, "name") || "Workflow",
    description: (raw.description as string | null | undefined) ?? null,
    status,
    definition: parseDefinition(raw.definition),
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

export async function fetchWorkflowList(organizationId?: string | null): Promise<WorkflowDetail[]> {
  if (isDemoMode()) return [...demoWorkflows];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.workflows.list, organizationId));
    return unwrapList(payload).map(mapWorkflow);
  } catch {
    return [];
  }
}

export async function fetchWorkflowDetail(
  id: string,
  organizationId?: string | null,
): Promise<WorkflowDetail | null> {
  if (isDemoMode()) {
    return demoWorkflows.find((w) => w.id === id) ?? null;
  }
  try {
    const payload = await api.get<Record<string, unknown>>(
      withOrg(API_ENDPOINTS.workflows.detail(id), organizationId),
    );
    return mapWorkflow(payload);
  } catch {
    return null;
  }
}

export async function createWorkflowDetail(
  input: CreateWorkflowInput,
  organizationId?: string | null,
): Promise<WorkflowDetail> {
  if (isDemoMode()) {
    const workflow: WorkflowDetail = {
      id: `wf-${Date.now()}`,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "draft",
      definition: emptyDefinition(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoWorkflows = [workflow, ...demoWorkflows];
    return workflow;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.workflows.create, organizationId),
    {
      name: input.name,
      description: input.description,
      status: input.status ?? "draft",
      definition: emptyDefinition(),
      organization_id: organizationId,
    },
  );
  return mapWorkflow(payload);
}

export async function saveWorkflowDefinition(
  id: string,
  definition: WorkflowDefinition,
  organizationId?: string | null,
): Promise<WorkflowDetail> {
  if (isDemoMode()) {
    demoWorkflows = demoWorkflows.map((w) =>
      w.id === id ? { ...w, definition, updatedAt: new Date().toISOString() } : w,
    );
    const found = demoWorkflows.find((w) => w.id === id);
    if (!found) throw new Error("Workflow not found");
    return found;
  }

  const payload = await api.patch<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.workflows.update(id), organizationId),
    { definition, organization_id: organizationId },
  );
  return mapWorkflow(payload);
}

export async function validateWorkflow(
  id: string,
  definition: WorkflowDefinition,
  organizationId?: string | null,
): Promise<ValidateResult> {
  if (isDemoMode()) {
    const errors: string[] = [];
    if (definition.nodes.length === 0) {
      errors.push("Add at least one node");
    }
    if (!definition.nodes.some((n) => n.data.kind === "trigger")) {
      errors.push("A trigger node is required");
    }
    return { valid: errors.length === 0, errors };
  }

  try {
    const payload = await api.post<{
      valid?: boolean;
      errors?: string[];
      detail?: string;
    }>(withOrg(API_ENDPOINTS.workflows.validate(id), organizationId), {
      definition,
      organization_id: organizationId,
    });
    return {
      valid: Boolean(payload.valid ?? (payload.errors?.length ?? 0) === 0),
      errors: payload.errors ?? (payload.detail ? [payload.detail] : []),
    };
  } catch {
    const errors: string[] = [];
    if (!definition.nodes.some((n) => n.data.kind === "trigger")) {
      errors.push("A trigger node is required");
    }
    return { valid: errors.length === 0, errors };
  }
}

export async function publishWorkflow(
  id: string,
  organizationId?: string | null,
): Promise<PublishResult> {
  if (isDemoMode()) {
    demoWorkflows = demoWorkflows.map((w) =>
      w.id === id ? { ...w, status: "active", updatedAt: new Date().toISOString() } : w,
    );
    return { id, status: "active", message: "Published (demo)" };
  }

  try {
    const payload = await api.post<{ status?: string; message?: string }>(
      withOrg(API_ENDPOINTS.workflows.publish(id), organizationId),
      { organization_id: organizationId },
    );
    return {
      id,
      status: payload.status ?? "active",
      message: payload.message,
    };
  } catch {
    await api.patch(withOrg(API_ENDPOINTS.workflows.update(id), organizationId), {
      status: "active",
      organization_id: organizationId,
    });
    return { id, status: "active", message: "Published" };
  }
}

export async function runWorkflow(id: string, organizationId?: string | null): Promise<RunResult> {
  if (isDemoMode()) {
    return {
      id: `run-${Date.now()}`,
      status: "succeeded",
      message: "Run completed (demo)",
    };
  }

  try {
    const payload = await api.post<{
      id?: string;
      status?: string;
      message?: string;
    }>(withOrg(API_ENDPOINTS.workflows.run(id), organizationId), {
      organization_id: organizationId,
    });
    return {
      id: payload.id ?? id,
      status: payload.status ?? "pending",
      message: payload.message,
    };
  } catch {
    const payload = await api.post<{
      id?: string;
      status?: string;
    }>("/automations/trigger/", {
      workflow_id: id,
      organization_id: organizationId,
    });
    return {
      id: payload.id ?? id,
      status: payload.status ?? "pending",
    };
  }
}
