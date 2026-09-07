"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchCurrentUser } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { fetchBootstrapState } from "@/features/organizations/api/organizations-api";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

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
  const pathname = usePathname();
  const hydrated = useAuthHydrated();
  const [bootstrapReady, setBootstrapReady] = useState(false);
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
    setBootstrapReady(false);

    async function syncProfileAndWorkspace() {
      try {
        const profile = await fetchCurrentUser();
        if (!cancelled) setUser(profile);
        const storedId = useOrganizationsStore.getState().activeOrganizationId;
        const state = await fetchBootstrapState(storedId);
        if (!cancelled && state.organization) {
          setOrganization(state.organization);
          setActiveOrganizationId(state.organization.id);

          const isStaff = Boolean(profile.isStaff || profile.isSuperuser);
          const allowsTrialSetup =
            pathname === ROUTES.onboarding ||
            pathname === ROUTES.billing ||
            pathname.startsWith("/billing/checkout/");
          if (!isStaff && state.nextStep !== "dashboard" && !allowsTrialSetup) {
            router.replace(
              `${ROUTES.onboarding}?step=${state.nextStep === "trial" ? "trial" : "profile"}`,
            );
            return;
          }
          if (!isStaff && state.nextStep === "dashboard" && pathname === ROUTES.onboarding) {
            router.replace(ROUTES.dashboard);
            return;
          }
        }
      } catch {
        // Keep persisted session; API failures are handled by the client refresh path.
      } finally {
        if (!cancelled) setBootstrapReady(true);
      }
    }

    void syncProfileAndWorkspace();
    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    hasValidSession,
    pathname,
    router,
    setUser,
    setOrganization,
    setActiveOrganizationId,
    user?.id,
  ]);

  if (!hydrated || (hasValidSession && !bootstrapReady)) {
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
