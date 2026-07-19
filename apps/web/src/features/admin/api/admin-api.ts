import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickNumber, pickString, unwrapList } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import { ApiError } from "@/lib/api/errors";
import type {
  AdminAiUsage,
  AdminAuditLog,
  AdminManualPayment,
  AdminOrganization,
  AdminOverview,
  AdminPayment,
  AdminPlatformSettings,
  AdminSubscription,
  AdminUser,
  CreateAdminUserInput,
  UpdateAdminUserInput,
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

function mapUser(raw: Record<string, unknown>): AdminUser {
  const first = pickString(raw, "firstName", "first_name");
  const last = pickString(raw, "lastName", "last_name");
  return {
    id: String(raw.id),
    fullName:
      pickString(raw, "fullName", "full_name", "name") ||
      [first, last].filter(Boolean).join(" ").trim() ||
      pickString(raw, "email") ||
      "User",
    email: pickString(raw, "email"),
    firstName: first || undefined,
    lastName: last || undefined,
    isStaff: Boolean(raw.isStaff ?? raw.is_staff),
    isSuperuser: Boolean(raw.isSuperuser ?? raw.is_superuser),
    isActive: Boolean(raw.isActive ?? raw.is_active ?? true),
    createdAt: pickIso(raw, "createdAt", "created_at", "date_joined"),
    lastLoginAt: pickString(raw, "lastLogin", "last_login") || null,
  };
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  if (isDemoMode()) {
    return {
      users: 128,
      organizations: 34,
      activeSubscriptions: 22,
      staffUsers: 3,
      mrrCents: 14900,
      revenueCents: 482000,
      aiTokens: 920000,
    };
  }
  const raw = await api.get<Record<string, unknown>>(API_ENDPOINTS.admin.analyticsOverview);
  return {
    users: pickNumber(raw, "users"),
    organizations: pickNumber(raw, "organizations"),
    activeSubscriptions: pickNumber(raw, "activeSubscriptions", "active_subscriptions"),
    staffUsers: pickNumber(raw, "staffUsers", "staff_users"),
    mrrCents: pickNumber(raw, "mrrCents", "mrr_cents"),
    revenueCents: pickNumber(raw, "revenueCents", "revenue_cents"),
    aiTokens: pickNumber(raw, "aiTokens", "ai_tokens"),
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  if (isDemoMode()) {
    return [
      {
        id: "u1",
        fullName: "Platform Admin",
        email: "admin@novixa.io",
        isStaff: true,
        isSuperuser: true,
        isActive: true,
        createdAt: new Date(now - 86400000 * 90).toISOString(),
      },
      {
        id: "u2",
        fullName: "Alex Owner",
        email: "owner@acme.com",
        isStaff: false,
        isSuperuser: false,
        isActive: true,
        createdAt: new Date(now - 86400000 * 40).toISOString(),
      },
    ];
  }
  const list = await getList(API_ENDPOINTS.admin.users);
  return list.map(mapUser);
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUser> {
  if (isDemoMode()) {
    return {
      id: `u-${Date.now()}`,
      fullName: [input.firstName, input.lastName].filter(Boolean).join(" ") || input.email,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      isStaff: Boolean(input.isStaff),
      isSuperuser: Boolean(input.isSuperuser),
      isActive: input.isActive !== false,
      createdAt: new Date().toISOString(),
    };
  }
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.admin.users, {
    email: input.email,
    password: input.password,
    first_name: input.firstName ?? "",
    last_name: input.lastName ?? "",
    is_staff: Boolean(input.isStaff),
    is_superuser: Boolean(input.isSuperuser),
    is_active: input.isActive !== false,
  });
  return mapUser(raw);
}

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUser> {
  if (isDemoMode()) {
    return {
      id,
      fullName: [input.firstName, input.lastName].filter(Boolean).join(" ") || "User",
      email: "user@example.com",
      isStaff: Boolean(input.isStaff),
      isSuperuser: Boolean(input.isSuperuser),
      isActive: input.isActive !== false,
      createdAt: new Date().toISOString(),
    };
  }
  const body: Record<string, unknown> = {};
  if (input.firstName !== undefined) body.first_name = input.firstName;
  if (input.lastName !== undefined) body.last_name = input.lastName;
  if (input.isStaff !== undefined) body.is_staff = input.isStaff;
  if (input.isSuperuser !== undefined) body.is_superuser = input.isSuperuser;
  if (input.isActive !== undefined) body.is_active = input.isActive;
  if (input.password) body.password = input.password;
  const raw = await api.patch<Record<string, unknown>>(API_ENDPOINTS.admin.user(id), body);
  return mapUser(raw);
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
    plan: pickString(raw, "plan", "planName", "plan_name", "plan_code") || "—",
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
    organizationName:
      pickString(raw, "organizationName", "organization_name", "org", "provider") || "Org",
    amount: pickNumber(raw, "amount", "total"),
    currency: pickString(raw, "currency") || "USD",
    status: pickString(raw, "status", "event_type") || "unknown",
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
    id: String(raw.id ?? raw.organization_id),
    organizationName: pickString(raw, "organizationName", "organization_name", "org") || "Org",
    tokens: pickNumber(raw, "tokens", "tokens_used"),
    requests: pickNumber(raw, "requests", "calls"),
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
    actor: pickString(raw, "actor", "user", "email", "actor_id") || "system",
    action: pickString(raw, "action", "event") || "event",
    target: pickString(raw, "target", "resource", "resource_id") || "—",
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

export async function updateAdminSettings(
  settings: Partial<AdminPlatformSettings>,
): Promise<AdminPlatformSettings> {
  if (settings.maintenanceMode !== undefined) {
    await api.patch(API_ENDPOINTS.admin.settings, {
      key: "maintenance_mode",
      value: { enabled: settings.maintenanceMode },
    });
  }
  if (settings.signupEnabled !== undefined) {
    await api.patch(API_ENDPOINTS.admin.settings, {
      key: "signup_enabled",
      value: { enabled: settings.signupEnabled },
    });
  }
  if (settings.defaultPlan !== undefined) {
    await api.patch(API_ENDPOINTS.admin.settings, {
      key: "default_plan",
      value: { plan: settings.defaultPlan },
    });
  }
  return fetchAdminSettings();
}

function mapManualPayment(raw: Record<string, unknown>): AdminManualPayment {
  return {
    id: String(raw.id),
    organizationName: pickString(raw, "organizationName", "organization_name") || "Organization",
    planName: pickString(raw, "planName", "plan_name", "plan_code") || "Plan",
    provider: pickString(raw, "provider") || "mtn_momo",
    status: pickString(raw, "status") || "pending",
    amountCents: pickNumber(raw, "amountCents", "amount_cents"),
    currency: pickString(raw, "currency") || "xaf",
    reference: pickString(raw, "reference"),
    payerPhone: pickString(raw, "payerPhone", "payer_phone"),
    transactionId: pickString(raw, "transactionId", "transaction_id"),
    requestedByEmail: pickString(raw, "requestedByEmail", "requested_by_email") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

export async function fetchAdminManualPayments(status?: string): Promise<AdminManualPayment[]> {
  if (isDemoMode()) {
    return [
      {
        id: "mp1",
        organizationName: "Acme Corp",
        planName: "Pro",
        provider: "mtn_momo",
        status: "submitted",
        amountCents: 5940000,
        currency: "xaf",
        reference: "NVX-DEMO01",
        payerPhone: "670000000",
        transactionId: "TXN123",
        requestedByEmail: "owner@acme.com",
        createdAt: new Date().toISOString(),
      },
    ];
  }
  const path = status
    ? `${API_ENDPOINTS.admin.manualPayments}?status=${encodeURIComponent(status)}`
    : API_ENDPOINTS.admin.manualPayments;
  const list = await getList(path);
  return list.map(mapManualPayment);
}

export async function approveAdminManualPayment(id: string): Promise<AdminManualPayment> {
  const raw = await api.post<Record<string, unknown>>(
    API_ENDPOINTS.admin.approveManualPayment(id),
    {},
  );
  return mapManualPayment(raw);
}

export async function rejectAdminManualPayment(
  id: string,
  reason = "",
): Promise<AdminManualPayment> {
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.admin.rejectManualPayment(id), {
    reason,
  });
  return mapManualPayment(raw);
}
