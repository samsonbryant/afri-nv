import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { pickNumber, unwrapList, withOrg } from "@/lib/api/org";
import type { ActivityItem, DashboardStats, NotificationItem } from "@/types/api";

export async function fetchDashboardStats(organizationId?: string | null): Promise<DashboardStats> {
  if (!organizationId) {
    return getDemoDashboardStats();
  }
  const raw = await api.get<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.dashboard.stats, organizationId),
  );
  const workflows = pickNumber(raw, "workflows_count", "workflowsActive", "workflows_active");
  const automations = pickNumber(
    raw,
    "automations_count",
    "automationsRunning",
    "automations_running",
  );
  const tokens = pickNumber(raw, "ai_tokens_used", "runsToday", "runs_today");
  return {
    workflowsActive: workflows,
    automationsRunning: automations,
    runsToday: tokens,
    successRate: workflows + automations === 0 ? 100 : 98,
  };
}

export async function fetchDashboardActivity(
  organizationId?: string | null,
): Promise<ActivityItem[]> {
  if (!organizationId) return [];
  const payload = await api.get<unknown>(withOrg(API_ENDPOINTS.dashboard.activity, organizationId));
  const items = Array.isArray(payload)
    ? payload
    : ((payload as { results?: unknown[] }).results ?? []);
  return items.map((item) => {
    const raw = item as Record<string, unknown>;
    return {
      id: String(raw.id),
      type: String(raw.type ?? "activity"),
      title: String(raw.title ?? "Activity"),
      description: raw.description ? String(raw.description) : undefined,
      createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    };
  });
}

function normalizeNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? "Notification"),
    body: raw.body ? String(raw.body) : undefined,
    href: (raw.link ?? raw.href ?? null) as string | null,
    read: Boolean(raw.is_read ?? raw.read ?? raw.read_at),
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
  };
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const payload = await api.get<unknown>(API_ENDPOINTS.notifications.list);
    const results = unwrapList(payload as NotificationItem[] | { results?: NotificationItem[] });
    return results.map((item) => normalizeNotification(item as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function markNotificationReadRequest(id: string): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.notifications.markRead(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError("Notifications are not available yet.", {
        status: 404,
        code: "not_found",
      });
    }
    throw error;
  }
}

export async function markAllNotificationsReadRequest(): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.notifications.markAllRead);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError("Notifications are not available yet.", {
        status: 404,
        code: "not_found",
      });
    }
    throw error;
  }
}

export function getDemoDashboardStats(): DashboardStats {
  return {
    workflowsActive: 0,
    automationsRunning: 0,
    runsToday: 0,
    successRate: 100,
  };
}
