"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import {
  createOrganizationRequest,
  fetchOrganizations,
  normalizeOrganization,
} from "@/features/organizations/api/organizations-api";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { unwrapList } from "@/lib/api/org";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import type { Organization } from "@/types/api";

type AuthGuardProps = {
  children: React.ReactNode;
};

/**
 * Wait until Zustand persist has rehydrated on the client.
 * Never touch `persist` during the initial SSR/render path — it can be undefined.
 */
function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi?.hasHydrated || !persistApi?.onFinishHydration) {
      setHydrated(true);
      return;
    }
    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setOrganization = useAuthStore((state) => state.setOrganization);
  const setActiveOrganizationId = useOrganizationsStore((state) => state.setActiveOrganizationId);

  const hasValidSession =
    isAuthenticated && Boolean(accessToken) && !accessToken?.startsWith("demo-");

  useEffect(() => {
    if (!hydrated) return;
    if (!hasValidSession) {
      router.replace(ROUTES.login);
    }
  }, [hydrated, hasValidSession, router]);

  useEffect(() => {
    if (!hydrated || !hasValidSession) return;
    let cancelled = false;

    async function syncProfileAndWorkspace() {
      try {
        const profile = await fetchCurrentUser();
        if (!cancelled) setUser(profile);

        const payload = await fetchOrganizations();
        const listed = unwrapList(
          payload as unknown as Organization[] | { results?: Organization[] },
        ).map((item) => normalizeOrganization(item as unknown as Record<string, unknown>));
        let first = listed[0] ?? null;
        if (!first) {
          const name =
            profile.fullName && profile.fullName !== "User"
              ? `${profile.fullName}'s Workspace`
              : "Personal Workspace";
          first = await createOrganizationRequest({
            name,
            slug: `workspace-${Date.now()}`,
          });
        }
        if (!cancelled && first) {
          setOrganization(first);
          const storedId = useOrganizationsStore.getState().activeOrganizationId;
          const stillValid = listed.some((org) => org.id === storedId);
          setActiveOrganizationId(stillValid && storedId ? storedId : first.id);
        }
      } catch {
        // Keep persisted session; API failures are handled by the client refresh path.
      }
    }

    void syncProfileAndWorkspace();
    return () => {
      cancelled = true;
    };
  }, [hydrated, hasValidSession, setUser, setOrganization, setActiveOrganizationId, user?.id]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!hasValidSession) {
    return null;
  }

  return <>{children}</>;
}
