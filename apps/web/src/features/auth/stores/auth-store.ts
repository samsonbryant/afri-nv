"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Organization, User } from "@/types/api";
import { AUTH_STORAGE_KEY } from "@/lib/constants";

type AuthState = {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setSession: (payload: {
    user: User;
    organization: Organization;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setSession: ({ user, organization, accessToken, refreshToken }) =>
        set({
          user,
          organization,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),
      logout: () =>
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
