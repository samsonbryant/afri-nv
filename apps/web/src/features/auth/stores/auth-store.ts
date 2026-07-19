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
  pendingTwoFactorToken: string | null;
  setSession: (payload: {
    user: User;
    organization: Organization | null;
    accessToken: string;
    refreshToken: string;
  }) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setPendingTwoFactorToken: (token: string | null) => void;
  setOrganization: (organization: Organization | null) => void;
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
      pendingTwoFactorToken: null,
      setSession: ({ user, organization, accessToken, refreshToken }) =>
        set({
          user,
          organization,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          pendingTwoFactorToken: null,
        }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setPendingTwoFactorToken: (pendingTwoFactorToken) => set({ pendingTwoFactorToken }),
      setOrganization: (organization) => set({ organization }),
      logout: () =>
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          pendingTwoFactorToken: null,
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
        pendingTwoFactorToken: state.pendingTwoFactorToken,
      }),
    },
  ),
);
