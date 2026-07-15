import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickNumber, pickString, unwrapList } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import { ApiError } from "@/lib/api/errors";
import type {
  AdminAiUsage,
  AdminAuditLog,
  AdminOrganization,
  AdminPayment,
  AdminPlatformSettings,
  AdminSubscription,
  AdminUser,
} from "@/features/admin/types";

const now = Date.now();

async function getList(path: string): Promise<Record<string, unknown>[]> {
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(path);
    return unwrapList(payload);
  } catch (error) {
    if (error instanceof ApiError && error.isForbidden) throw error;
    return [];
  }
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (isDemoMode()) {
    return [
      {
        id: "u1",
        fullName: "Platform Admin",
        email: "admin@novixa.io",
        isStaff: true,
        isActive: true,
        createdAt: new Date(now - 86400000 * 90).toISOString(),
      },
      {
        id: "u2",
        fullName: "Alex Owner",
        email: "owner@acme.com",
        isStaff: false,
        isActive: true,
        createdAt: new Date(now - 86400000 * 40).toISOString(),
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.users);
  return list.map((raw) => ({
    id: String(raw.id),
    fullName: pickString(raw, "fullName", "full_name", "name") || "User",
    email: pickString(raw, "email"),
    isStaff: Boolean(raw.isStaff ?? raw.is_staff),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt: pickIso(raw, "createdAt", "created_at"),
  }));
}

export async function fetchAdminOrganizations(): Promise<AdminOrganization[]> {
  if (isDemoMode()) {
    return [
      {
        id: "o1",
        name: "Acme Corp",
        slug: "acme",
        plan: "growth",
        membersCount: 12,
        createdAt: new Date(now - 86400000 * 60).toISOString(),
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.organizations);
  return list.map((raw) => ({
    id: String(raw.id),
    name: pickString(raw, "name") || "Organization",
    slug: pickString(raw, "slug"),
    plan: pickString(raw, "plan") || "free",
    membersCount: pickNumber(raw, "membersCount", "members_count", "members"),
    createdAt: pickIso(raw, "createdAt", "created_at"),
  }));
}

export async function fetchAdminSubscriptions(): Promise<AdminSubscription[]> {
  if (isDemoMode()) {
    return [
      {
        id: "s1",
        organizationName: "Acme Corp",
        plan: "Growth",
        status: "active",
        mrr: 149,
        currentPeriodEnd: new Date(now + 86400000 * 20).toISOString(),
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.subscriptions);
  return list.map((raw) => ({
    id: String(raw.id),
    organizationName: pickString(raw, "organizationName", "organization_name", "org") || "Org",
    plan: pickString(raw, "plan", "planName", "plan_name") || "—",
    status: pickString(raw, "status") || "unknown",
    mrr: pickNumber(raw, "mrr"),
    currentPeriodEnd: pickIso(raw, "currentPeriodEnd", "current_period_end", "period_end"),
  }));
}

export async function fetchAdminPayments(): Promise<AdminPayment[]> {
  if (isDemoMode()) {
    return [
      {
        id: "p1",
        organizationName: "Acme Corp",
        amount: 149,
        currency: "USD",
        status: "succeeded",
        createdAt: new Date(now - 86400000 * 5).toISOString(),
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.payments);
  return list.map((raw) => ({
    id: String(raw.id),
    organizationName: pickString(raw, "organizationName", "organization_name", "org") || "Org",
    amount: pickNumber(raw, "amount", "total"),
    currency: pickString(raw, "currency") || "USD",
    status: pickString(raw, "status") || "unknown",
    createdAt: pickIso(raw, "createdAt", "created_at"),
  }));
}

export async function fetchAdminAiUsage(): Promise<AdminAiUsage[]> {
  if (isDemoMode()) {
    return [
      {
        id: "a1",
        organizationName: "Acme Corp",
        tokens: 42000,
        requests: 820,
        cost: 18.4,
        period: "2026-07",
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.aiUsage);
  return list.map((raw) => ({
    id: String(raw.id),
    organizationName: pickString(raw, "organizationName", "organization_name", "org") || "Org",
    tokens: pickNumber(raw, "tokens"),
    requests: pickNumber(raw, "requests"),
    cost: pickNumber(raw, "cost"),
    period: pickString(raw, "period") || "—",
  }));
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLog[]> {
  if (isDemoMode()) {
    return [
      {
        id: "l1",
        actor: "admin@novixa.io",
        action: "user.impersonate",
        target: "owner@acme.com",
        ipAddress: "203.0.113.10",
        createdAt: new Date(now - 3600000).toISOString(),
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.auditLogs);
  return list.map((raw) => ({
    id: String(raw.id),
    actor: pickString(raw, "actor", "user", "email") || "system",
    action: pickString(raw, "action", "event") || "event",
    target: pickString(raw, "target", "resource") || "—",
    ipAddress: pickString(raw, "ipAddress", "ip_address", "ip") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at", "timestamp"),
  }));
}

export async function fetchAdminSettings(): Promise<AdminPlatformSettings> {
  if (isDemoMode()) {
    return {
      maintenanceMode: false,
      signupEnabled: true,
      defaultPlan: "starter",
    };
  }
  try {
    const payload = await api.get<Record<string, unknown>>(API_ENDPOINTS.admin.settings);
    return {
      maintenanceMode: Boolean(payload.maintenanceMode ?? payload.maintenance_mode),
      signupEnabled: Boolean(payload.signupEnabled ?? payload.signup_enabled ?? true),
      defaultPlan: pickString(payload, "defaultPlan", "default_plan") || "starter",
    };
  } catch (error) {
    if (error instanceof ApiError && error.isForbidden) throw error;
    return {
      maintenanceMode: false,
      signupEnabled: true,
      defaultPlan: "starter",
    };
  }
}
