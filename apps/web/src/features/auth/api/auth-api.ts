import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AuthResponse, User } from "@/types/api";
import type { LoginCredentials, RegisterCredentials } from "@/features/auth/types";

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponse> {
  return api.post<AuthResponse>(API_ENDPOINTS.auth.login, {
    email: credentials.email,
    password: credentials.password,
  });
}

export async function registerRequest(credentials: RegisterCredentials): Promise<AuthResponse> {
  return api.post<AuthResponse>(API_ENDPOINTS.auth.register, {
    full_name: credentials.fullName,
    email: credentials.email,
    organization_name: credentials.organizationName,
    password: credentials.password,
  });
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post(API_ENDPOINTS.auth.logout);
  } catch {
    // Local logout should succeed even if the API call fails.
  }
}

export async function fetchCurrentUser(): Promise<User> {
  return api.get<User>(API_ENDPOINTS.auth.me);
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
  return {
    user: {
      id: "demo-user",
      email,
      fullName,
      avatarUrl: null,
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
