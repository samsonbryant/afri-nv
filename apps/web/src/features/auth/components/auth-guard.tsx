"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/stores/auth-store";
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
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const hasValidSession =
    isAuthenticated && Boolean(accessToken) && !accessToken?.startsWith("demo-");

  useEffect(() => {
    if (!hydrated) return;
    if (!hasValidSession) {
      router.replace(ROUTES.login);
    }
  }, [hydrated, hasValidSession, router]);

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
