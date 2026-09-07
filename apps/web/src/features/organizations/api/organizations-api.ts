import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { unwrapList } from "@/lib/api/org";
import { toSameOriginAssetUrl } from "@/lib/constants";
import type { Organization, OrganizationMember, PaginatedResponse } from "@/types/api";

function notAvailable(feature: string, error: unknown): never {
  if (error instanceof ApiError && error.status === 404) {
    throw new ApiError(`${feature} is not available yet.`, {
      status: 404,
      code: "not_found",
    });
  }
  throw error;
}

function pickString(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

export function normalizeOrganization(raw: Record<string, unknown>): Organization {
  const businessContext =
    raw.business_context && typeof raw.business_context === "object"
      ? (raw.business_context as Record<string, unknown>)
      : raw.businessContext && typeof raw.businessContext === "object"
        ? (raw.businessContext as Record<string, unknown>)
        : {};
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? "Organization"),
    slug: String(raw.slug ?? ""),
    role: (raw.role as Organization["role"]) || undefined,
    createdAt: String(raw.created_at ?? raw.createdAt ?? new Date().toISOString()),
    description: pickString(raw, "description") || undefined,
    industry: pickString(raw, "industry") || undefined,
    website: pickString(raw, "website") || undefined,
    phone: pickString(raw, "phone") || undefined,
    address: pickString(raw, "address") || undefined,
    logoUrl: toSameOriginAssetUrl(pickString(raw, "logo_url", "logoUrl")) || null,
    businessContext,
    onboardingCompleted: Boolean(raw.onboarding_completed ?? raw.onboardingCompleted),
    onboardingCompletedAt:
      pickString(raw, "onboarding_completed_at", "onboardingCompletedAt") || null,
    plan: pickString(raw, "plan") || undefined,
  };
}

export type BootstrapState = {
  organization: Organization | null;
  subscriptionStatus: string;
  trialEnd: string | null;
  paymentMethodReady: boolean;
  entitlementActive: boolean;
  profileComplete: boolean;
  nextStep: "organization" | "trial" | "profile" | "dashboard";
};

export async function fetchBootstrapState(organizationId?: string | null): Promise<BootstrapState> {
  const suffix = organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : "";
  const raw = await api.get<Record<string, unknown>>(
    `${API_ENDPOINTS.organizations.bootstrap}${suffix}`,
  );
  const organizationRaw =
    raw.organization && typeof raw.organization === "object"
      ? (raw.organization as Record<string, unknown>)
      : null;
  return {
    organization: organizationRaw ? normalizeOrganization(organizationRaw) : null,
    subscriptionStatus: pickString(raw, "subscription_status") || "none",
    trialEnd: pickString(raw, "trial_end") || null,
    paymentMethodReady: Boolean(raw.payment_method_ready),
    entitlementActive: Boolean(raw.entitlement_active),
    profileComplete: Boolean(raw.profile_complete),
    nextStep: (pickString(raw, "next_step") as BootstrapState["nextStep"]) || "organization",
  };
}

export async function completeOnboardingRequest(organizationId: string): Promise<Organization> {
  const raw = await api.post<Record<string, unknown>>(
    API_ENDPOINTS.organizations.completeOnboarding(organizationId),
    {},
  );
  const organizationRaw =
    raw.organization && typeof raw.organization === "object"
      ? (raw.organization as Record<string, unknown>)
      : raw;
  return normalizeOrganization(organizationRaw);
}

export function normalizeMembership(raw: Record<string, unknown>): OrganizationMember {
  const first = pickString(raw, "first_name", "firstName");
  const last = pickString(raw, "last_name", "lastName");
  const fullName =
    pickString(raw, "full_name", "fullName", "name") ||
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(raw, "email") ||
    "Member";
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.user_id ?? raw.userId ?? ""),
    email: pickString(raw, "email") || undefined,
    fullName,
    role: pickString(raw, "role") || "member",
  };
}

export async function fetchOrganizations(): Promise<PaginatedResponse<Organization>> {
  return api.get<PaginatedResponse<Organization>>(API_ENDPOINTS.organizations.list);
}

export async function fetchOrganization(id: string): Promise<Organization> {
  return api.get<Organization>(API_ENDPOINTS.organizations.detail(id));
}

export async function createOrganizationRequest(payload: {
  name: string;
  slug: string;
}): Promise<Organization> {
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.organizations.create, payload);
  return normalizeOrganization(raw);
}

export async function updateOrganizationRequest(
  organizationId: string,
  payload: FormData | Record<string, unknown>,
): Promise<Organization> {
  const raw = await api.patch<Record<string, unknown>>(
    API_ENDPOINTS.organizations.update(organizationId),
    payload,
  );
  return normalizeOrganization(raw);
}

export async function fetchMemberships(organizationId: string): Promise<OrganizationMember[]> {
  try {
    const payload = await api.get<unknown>(API_ENDPOINTS.organizations.memberships(organizationId));
    const results = unwrapList(
      payload as OrganizationMember[] | { results?: OrganizationMember[] },
    );
    return results.map((item) => normalizeMembership(item as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function inviteMemberRequest(
  organizationId: string,
  payload: { email: string; role: string },
): Promise<unknown> {
  try {
    return await api.post(API_ENDPOINTS.organizations.memberships(organizationId), {
      email: payload.email,
      role: payload.role === "viewer" ? "member" : payload.role,
    });
  } catch (error) {
    notAvailable("Team invites", error);
  }
}

export async function removeMembershipRequest(
  organizationId: string,
  membershipId: string,
): Promise<void> {
  try {
    await api.delete(API_ENDPOINTS.organizations.membershipDetail(organizationId, membershipId));
  } catch (error) {
    notAvailable("Member removal", error);
  }
}

export async function acceptInviteRequest(token: string): Promise<Organization | null> {
  try {
    const raw = await api.post<Record<string, unknown>>("/organizations/invites/accept/", {
      token,
    });
    if (raw && typeof raw === "object" && ("id" in raw || "organization" in raw)) {
      const orgRaw =
        raw.organization && typeof raw.organization === "object"
          ? (raw.organization as Record<string, unknown>)
          : raw;
      return normalizeOrganization(orgRaw);
    }
    return null;
  } catch (error) {
    notAvailable("Invite acceptance", error);
  }
}
