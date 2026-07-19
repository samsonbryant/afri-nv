import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { unwrapList } from "@/lib/api/org";
import { toSameOriginAssetUrl } from "@/lib/constants";
import type { AuthResponse, Organization, User } from "@/types/api";
import type { LoginCredentials, RegisterCredentials } from "@/features/auth/types";

type RawUser = Record<string, unknown>;

export type AuthSession = {
  id: string;
  jti?: string;
  device?: string;
  ipAddress?: string;
  lastActiveAt: string;
  current?: boolean;
};

export type TwoFactorStatus = {
  enabled: boolean;
};

export type TwoFactorSetup = {
  otpauthUrl?: string;
  secret?: string;
};

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

export function normalizeUser(raw: RawUser): User {
  const first = pickString(raw, "first_name", "firstName");
  const last = pickString(raw, "last_name", "lastName");
  const fullName =
    pickString(raw, "fullName", "full_name") ||
    [first, last].filter(Boolean).join(" ").trim() ||
    pickString(raw, "email") ||
    "User";
  const now = new Date().toISOString();
  return {
    id: String(raw.id ?? ""),
    email: pickString(raw, "email"),
    fullName,
    firstName: first || undefined,
    lastName: last || undefined,
    avatarUrl: toSameOriginAssetUrl(
      (raw.avatarUrl ?? raw.avatar_url ?? raw.avatar ?? null) as string | null,
    ),
    isStaff: Boolean(raw.isStaff ?? raw.is_staff),
    isSuperuser: Boolean(raw.isSuperuser ?? raw.is_superuser),
    isActive:
      raw.isActive === undefined && raw.is_active === undefined
        ? true
        : Boolean(raw.isActive ?? raw.is_active),
    createdAt: pickString(raw, "createdAt", "created_at") || now,
    updatedAt: pickString(raw, "updatedAt", "updated_at") || now,
  };
}

export function normalizeOrganization(raw: Record<string, unknown>): Organization {
  return {
    id: String(raw.id ?? ""),
    name: pickString(raw, "name") || "Organization",
    slug: pickString(raw, "slug"),
    role: (raw.role as Organization["role"]) || undefined,
    createdAt: pickString(raw, "createdAt", "created_at") || new Date().toISOString(),
  };
}

function splitFullName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  const first_name = parts[0] ?? "";
  const last_name = parts.slice(1).join(" ");
  return { first_name, last_name };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

async function fetchFirstOrganization(accessToken: string): Promise<Organization | null> {
  try {
    const payload = await api.get<unknown>(API_ENDPOINTS.organizations.list, {
      token: accessToken,
    });
    const results = unwrapList(payload as Organization[] | { results?: Organization[] });
    const first = results[0];
    if (!first) return null;
    return normalizeOrganization(first as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function buildAuthResponse(
  raw: Record<string, unknown>,
  options?: { organizationName?: string },
): Promise<AuthResponse> {
  const tokensRaw = (raw.tokens ?? raw) as Record<string, unknown>;
  const access = pickString(tokensRaw, "access", "access_token");
  const refresh = pickString(tokensRaw, "refresh", "refresh_token");
  if (!access || !refresh) {
    throw new ApiError("Authentication tokens were missing from the response.", {
      status: 502,
      code: "invalid_auth_response",
    });
  }

  const userRaw = (raw.user as RawUser | undefined) ?? raw;
  const user = normalizeUser(userRaw);

  let organization: Organization | null = null;
  if (raw.organization && typeof raw.organization === "object") {
    organization = normalizeOrganization(raw.organization as Record<string, unknown>);
  } else {
    organization = await fetchFirstOrganization(access);
  }

  if (!organization && options?.organizationName) {
    try {
      const created = await api.post<Record<string, unknown>>(
        API_ENDPOINTS.organizations.create,
        {
          name: options.organizationName,
          slug: slugify(options.organizationName) || `org-${Date.now()}`,
        },
        { token: access },
      );
      organization = normalizeOrganization(created);
    } catch {
      organization = null;
    }
  }

  if (!organization) {
    const fallbackName =
      user.fullName && user.fullName !== "User"
        ? `${user.fullName}'s Workspace`
        : "Personal Workspace";
    try {
      const created = await api.post<Record<string, unknown>>(
        API_ENDPOINTS.organizations.create,
        {
          name: fallbackName,
          slug: slugify(fallbackName) || `workspace-${Date.now()}`,
        },
        { token: access },
      );
      organization = normalizeOrganization(created);
    } catch {
      organization = null;
    }
  }

  return {
    user,
    organization,
    tokens: { access, refresh },
  };
}

function isTwoFactorChallenge(raw: Record<string, unknown>): string | null {
  const token = pickString(
    raw,
    "two_factor_token",
    "twoFactorToken",
    "pending_token",
    "temp_token",
  );
  const required =
    raw.requires_2fa === true ||
    raw.requiresTwoFactor === true ||
    raw.two_factor_required === true ||
    Boolean(token);
  return required && token ? token : required ? "pending" : null;
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.login, {
    email: credentials.email,
    password: credentials.password,
  });
  const challenge = isTwoFactorChallenge(raw);
  if (challenge) {
    throw new ApiError("Two-factor authentication required.", {
      status: 403,
      code: "two_factor_required",
      details: { twoFactorToken: challenge === "pending" ? null : challenge },
    });
  }
  return buildAuthResponse(raw);
}

export async function registerRequest(credentials: RegisterCredentials): Promise<AuthResponse> {
  const { first_name, last_name } = splitFullName(credentials.fullName);
  try {
    const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.register, {
      email: credentials.email,
      password: credentials.password,
      first_name,
      last_name,
      full_name: credentials.fullName,
      organization_name: credentials.organizationName,
    });
    return buildAuthResponse(raw, { organizationName: credentials.organizationName });
  } catch (error) {
    // Retry without org fields if backend rejects unknown keys.
    if (error instanceof ApiError && (error.status === 400 || error.status === 422)) {
      const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.register, {
        email: credentials.email,
        password: credentials.password,
        first_name,
        last_name,
      });
      return buildAuthResponse(raw, { organizationName: credentials.organizationName });
    }
    throw error;
  }
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.auth.logout);
  } catch {
    // Local logout should succeed even if the API call fails.
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const raw = await api.get<RawUser>(API_ENDPOINTS.auth.me);
  return normalizeUser(raw);
}

export async function updateProfileRequest(payload: {
  firstName?: string;
  lastName?: string;
}): Promise<User> {
  const raw = await api.patch<RawUser>(
    API_ENDPOINTS.auth.me,
    {
      first_name: payload.firstName,
      last_name: payload.lastName,
    },
    { skipAuth: false },
  );
  return normalizeUser(raw);
}

export async function changePasswordRequest(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post(API_ENDPOINTS.auth.changePassword, {
    current_password: payload.currentPassword,
    new_password: payload.newPassword,
  });
}

export async function uploadAvatarRequest(file: File): Promise<User> {
  const body = new FormData();
  body.append("avatar", file);
  const raw = await api.post<RawUser>(API_ENDPOINTS.auth.avatar, body);
  return normalizeUser(raw);
}

export async function forgotPasswordRequest(email: string): Promise<{ detail?: string }> {
  try {
    return await api.post<{ detail?: string }>(API_ENDPOINTS.auth.forgotPassword, { email });
  } catch (error) {
    notAvailable("Password reset", error);
  }
}

export async function resetPasswordRequest(payload: {
  token: string;
  password: string;
}): Promise<{ detail?: string }> {
  try {
    return await api.post<{ detail?: string }>(API_ENDPOINTS.auth.resetPassword, {
      token: payload.token,
      password: payload.password,
    });
  } catch (error) {
    notAvailable("Password reset", error);
  }
}

export async function verifyEmailRequest(token: string): Promise<{ detail?: string }> {
  try {
    return await api.post<{ detail?: string }>(API_ENDPOINTS.auth.verifyEmail, { token });
  } catch (error) {
    notAvailable("Email verification", error);
  }
}

export async function verifyTwoFactorRequest(payload: {
  code: string;
  twoFactorToken?: string;
}): Promise<AuthResponse> {
  try {
    const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.twoFactor, {
      code: payload.code,
      token: payload.twoFactorToken,
      two_factor_token: payload.twoFactorToken,
    });
    return buildAuthResponse(raw);
  } catch (error) {
    notAvailable("Two-factor verification", error);
  }
}

export async function fetchTwoFactorStatus(): Promise<TwoFactorStatus> {
  try {
    const me = await api.get<RawUser>(API_ENDPOINTS.auth.me);
    const enabled = Boolean(me.is_2fa_enabled ?? me.is2faEnabled ?? me.two_factor_enabled);
    return { enabled };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { enabled: false };
    }
    throw error;
  }
}

export async function enableTwoFactorRequest(): Promise<TwoFactorSetup> {
  try {
    const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.twoFactorEnable);
    return {
      otpauthUrl: pickString(raw, "otpauth_url", "otpauthUrl", "uri"),
      secret: pickString(raw, "secret") || undefined,
    };
  } catch (error) {
    notAvailable("Two-factor setup", error);
  }
}

export async function confirmTwoFactorRequest(code: string): Promise<{ detail?: string }> {
  try {
    return await api.post<{ detail?: string }>(API_ENDPOINTS.auth.twoFactorConfirm, { code });
  } catch (error) {
    notAvailable("Two-factor confirmation", error);
  }
}

export async function disableTwoFactorRequest(payload: {
  password: string;
  code: string;
}): Promise<{ detail?: string }> {
  try {
    return await api.post<{ detail?: string }>(API_ENDPOINTS.auth.twoFactorDisable, payload);
  } catch (error) {
    notAvailable("Two-factor disable", error);
  }
}

function normalizeSession(raw: Record<string, unknown>): AuthSession {
  return {
    id: String(raw.id ?? raw.jti ?? ""),
    jti: pickString(raw, "jti") || undefined,
    device: pickString(raw, "device", "user_agent", "userAgent") || undefined,
    ipAddress: pickString(raw, "ip_address", "ipAddress") || undefined,
    lastActiveAt:
      pickString(raw, "last_active_at", "lastActiveAt", "updated_at", "created_at") ||
      new Date().toISOString(),
    current: Boolean(raw.current ?? raw.is_current),
  };
}

export async function fetchSessions(): Promise<AuthSession[]> {
  try {
    const payload = await api.get<unknown>(API_ENDPOINTS.auth.sessions);
    const results = unwrapList(payload as AuthSession[] | { results?: AuthSession[] });
    return results.map((item) => normalizeSession(item as unknown as Record<string, unknown>));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function revokeSessionRequest(sessionId: string): Promise<void> {
  try {
    await api.delete(API_ENDPOINTS.auth.revokeSession(sessionId));
  } catch (error) {
    notAvailable("Session revoke", error);
  }
}

export async function completeGoogleOAuth(
  idToken: string | null,
  accessToken: string | null,
): Promise<AuthResponse> {
  try {
    const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.socialGoogle, {
      id_token: idToken,
      access_token: accessToken,
    });
    return buildAuthResponse(raw);
  } catch (error) {
    notAvailable("Google sign-in", error);
  }
}

export async function completeGithubOAuth(code: string): Promise<AuthResponse> {
  try {
    const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.auth.socialGithub, {
      code,
    });
    return buildAuthResponse(raw);
  } catch (error) {
    notAvailable("GitHub sign-in", error);
  }
}

/**
 * Demo-mode auth helpers for local UI without a live API.
 * Used when NEXT_PUBLIC_API_URL is unreachable or in development demos.
 */
export function createDemoAuthResponse(
  email: string,
  fullName = "Novixa User",
  organizationName = "Novixa Workspace",
): AuthResponse {
  const now = new Date().toISOString();
  const isStaff = /admin|super/i.test(email);
  return {
    user: {
      id: "demo-user",
      email,
      fullName,
      avatarUrl: null,
      isStaff,
      isSuperuser: isStaff,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    organization: {
      id: "demo-org",
      name: organizationName,
      slug: organizationName.toLowerCase().replace(/\s+/g, "-"),
      role: "owner",
      createdAt: now,
    },
    tokens: {
      access: `demo-access-${Date.now()}`,
      refresh: `demo-refresh-${Date.now()}`,
    },
  };
}
