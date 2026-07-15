import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import type { Automation, PaginatedResponse } from "@/types/api";

function mapRunToAutomation(raw: Record<string, unknown>): Automation {
  const status = String(raw.status ?? "pending").toLowerCase();
  return {
    id: String(raw.id),
    name: pickString(raw, "name", "workflow_name") || `Run ${String(raw.id).slice(0, 8)}`,
    description: pickString(raw, "error", "description") || null,
    enabled: status === "running" || status === "pending" || status === "succeeded",
    triggerType: pickString(raw, "trigger_type", "triggerType") || "manual",
    createdAt: pickIso(raw, "created_at", "createdAt"),
    updatedAt: pickIso(raw, "updated_at", "updatedAt", "finished_at", "created_at"),
    lastRunAt: pickIso(raw, "finished_at", "started_at", "created_at"),
  };
}

function asPage(items: Automation[]): PaginatedResponse<Automation> {
  return { count: items.length, next: null, previous: null, results: items };
}

/** Lists automation runs for an organization (backend automation feed). */
export async function fetchAutomations(
  organizationId?: string | null,
): Promise<PaginatedResponse<Automation>> {
  if (!organizationId) return asPage([]);
  const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.automations.list, organizationId));
  const items = unwrapList(payload as Automation[] | { results?: Automation[] }).map((item) =>
    mapRunToAutomation(item as unknown as Record<string, unknown>),
  );
  return asPage(items);
}

export async function toggleAutomation(id: string): Promise<Automation> {
  // Soft UI affordance until a dedicated toggle endpoint exists.
  return {
    id,
    name: "Automation",
    description: null,
    enabled: true,
    triggerType: "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
