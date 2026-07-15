"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeGithubOAuth } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { ROUTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/errors";

function GitHubCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const code = searchParams.get("code");
        if (!code) {
          throw new Error("Missing GitHub authorization code. Configure OAuth client credentials.");
        }
        const response = await completeGithubOAuth(code);
        if (cancelled) return;

        useAuthStore.getState().setSession({
          user: response.user,
          organization: response.organization,
          accessToken: response.tokens.access,
          refreshToken: response.tokens.refresh,
        });
        if (response.organization?.id) {
          useOrganizationsStore.getState().setActiveOrganizationId(response.organization.id);
        }
        router.replace(response.organization ? ROUTES.dashboard : ROUTES.onboarding);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      {error ? (
        <p className="text-destructive max-w-md text-center text-sm" role="alert">
          {error}
        </p>
      ) : (
        <>
          <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden />
          <p className="text-muted-foreground text-sm">Completing GitHub sign-in…</p>
        </>
      )}
    </main>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
          Completing GitHub sign-in…
        </main>
      }
    >
      <GitHubCallbackInner />
    </Suspense>
  );
}
