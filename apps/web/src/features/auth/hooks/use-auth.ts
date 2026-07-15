"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createDemoAuthResponse,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import type { LoginCredentials, RegisterCredentials } from "@/features/auth/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";
import { ROUTES } from "@/lib/constants";

function applySession(response: Awaited<ReturnType<typeof loginRequest>>) {
  useAuthStore.getState().setSession({
    user: response.user,
    organization: response.organization,
    accessToken: response.tokens.access,
    refreshToken: response.tokens.refresh,
  });
}

async function withDemoFallback<T>(request: () => Promise<T>, demo: () => T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof TypeError || (error instanceof ApiError && error.status >= 500)) {
      return demo();
    }
    throw error;
  }
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
      router.push(ROUTES.dashboard);
    },
    onError: (error) => {
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
      router.push(ROUTES.dashboard);
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

export function useAuth() {
  return useAuthStore();
}
