"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  completeGithubOAuth,
  completeGoogleOAuth,
  confirmTwoFactorRequest,
  createDemoAuthResponse,
  disableTwoFactorRequest,
  enableTwoFactorRequest,
  fetchSessions,
  fetchTwoFactorStatus,
  forgotPasswordRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  resetPasswordRequest,
  revokeSessionRequest,
  verifyEmailRequest,
  verifyTwoFactorRequest,
} from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import type { LoginCredentials, RegisterCredentials } from "@/features/auth/types";
import type { ForgotPasswordInput, ResetPasswordInput } from "@/lib/validations/auth";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { APP_URL, isDemoMode, ROUTES } from "@/lib/constants";
import type { AuthResponse } from "@/types/api";

export const authKeys = {
  all: ["auth"] as const,
  twoFactor: () => [...authKeys.all, "two-factor"] as const,
  sessions: () => [...authKeys.all, "sessions"] as const,
};

function applySession(response: AuthResponse) {
  useAuthStore.getState().setSession({
    user: response.user,
    organization: response.organization,
    accessToken: response.tokens.access,
    refreshToken: response.tokens.refresh,
  });
  if (response.organization?.id) {
    useOrganizationsStore.getState().setActiveOrganizationId(response.organization.id);
  }
}

async function withDemoFallback<T>(request: () => Promise<T>, demo: () => T): Promise<T> {
  // Never invent demo JWTs against a live API — those cause widespread 401s.
  if (!isDemoMode()) {
    return request();
  }
  try {
    return await request();
  } catch (error) {
    if (error instanceof TypeError || (error instanceof ApiError && error.status >= 500)) {
      return demo();
    }
    throw error;
  }
}

function handleTwoFactorRequired(error: unknown, router: ReturnType<typeof useRouter>): boolean {
  if (error instanceof ApiError && error.code === "two_factor_required") {
    const token =
      typeof error.details?.twoFactorToken === "string" ? error.details.twoFactorToken : null;
    useAuthStore.getState().setPendingTwoFactorToken(token);
    router.push(ROUTES.twoFactor);
    return true;
  }
  return false;
}

function postAuthRoute(data: AuthResponse): string {
  if (data.user.isStaff || data.user.isSuperuser) return ROUTES.admin;
  return data.organization ? ROUTES.dashboard : ROUTES.onboarding;
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) =>
      withDemoFallback(
        () => loginRequest(credentials),
        () => createDemoAuthResponse(credentials.email),
      ),
    onSuccess: (data) => {
      applySession(data);
      toast.success("Welcome back");
      router.push(postAuthRoute(data));
    },
    onError: (error) => {
      if (handleTwoFactorRequired(error, router)) return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) =>
      withDemoFallback(
        () => registerRequest(credentials),
        () =>
          createDemoAuthResponse(
            credentials.email,
            credentials.fullName,
            credentials.organizationName,
          ),
      ),
    onSuccess: (data) => {
      applySession(data);
      toast.success("Account created");
      router.push(postAuthRoute(data));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      logout();
      router.push(ROUTES.login);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (values: ForgotPasswordInput) => forgotPasswordRequest(values.email),
    onSuccess: (data) => {
      toast.success(data.detail ?? "If that email exists, a reset link is on its way.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (values: ResetPasswordInput) =>
      resetPasswordRequest({ token: values.token, password: values.password }),
    onSuccess: (data) => {
      toast.success(data.detail ?? "Password updated. You can sign in now.");
      router.push(ROUTES.login);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: { token: string }) => verifyEmailRequest(payload.token),
  });
}

export function useVerifyTwoFactor() {
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: { code: string; twoFactorToken?: string }) =>
      verifyTwoFactorRequest(payload),
    onSuccess: (data) => {
      applySession(data);
      toast.success("Verified");
      router.push(postAuthRoute(data));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useTwoFactorStatus() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: authKeys.twoFactor(),
    enabled: isAuthenticated,
    queryFn: fetchTwoFactorStatus,
  });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enableTwoFactorRequest,
    onSuccess: () => {
      toast.success("Scan the setup code, then confirm with a 6-digit code.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.twoFactor() });
    },
  });
}

export function useConfirmTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => confirmTwoFactorRequest(code),
    onSuccess: () => {
      toast.success("Two-factor authentication enabled");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.twoFactor() });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { password: string; code: string }) => disableTwoFactorRequest(payload),
    onSuccess: () => {
      toast.success("Two-factor authentication disabled");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.twoFactor() });
    },
  });
}

export function useSessions() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: authKeys.sessions(),
    enabled: isAuthenticated,
    queryFn: fetchSessions,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => revokeSessionRequest(sessionId),
    onSuccess: () => {
      toast.success("Session revoked");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.sessions() });
    },
  });
}

export function useSocialAuth() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (provider: "google" | "github") => {
      if (isDemoMode()) {
        return createDemoAuthResponse(`demo+${provider}@novixa.app`, "Demo User");
      }

      if (provider === "google") {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) {
          throw new ApiError("Google sign-in is not configured.", {
            status: 503,
            code: "oauth_not_configured",
          });
        }
        const redirectUri = `${APP_URL.replace(/\/$/, "")}/auth/callback/google`;
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "token id_token",
          scope: "openid email profile",
          nonce: String(Date.now()),
        });
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return null;
      }

      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      if (!clientId) {
        throw new ApiError("GitHub sign-in is not configured.", {
          status: 503,
          code: "oauth_not_configured",
        });
      }
      const redirectUri = `${APP_URL.replace(/\/$/, "")}/auth/callback/github`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: "user:email",
      });
      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
      return null;
    },
    onSuccess: (data) => {
      if (!data) return;
      applySession(data);
      toast.success("Welcome");
      router.push(postAuthRoute(data));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Re-export OAuth completers for callback pages that already import from hooks if needed. */
export { completeGoogleOAuth, completeGithubOAuth };

export function useAuth() {
  return useAuthStore();
}
