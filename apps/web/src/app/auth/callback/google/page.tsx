"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeGoogleOAuth } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { ROUTES } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/errors";

function readHashParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  return new URLSearchParams(hash);
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const hash = readHashParams();
        const query = new URLSearchParams(window.location.search);
        const idToken = hash.get("id_token") || query.get("id_token");
        const accessToken = hash.get("access_token") || query.get("access_token");

        if (!idToken && !accessToken) {
          throw new Error(
            "Missing Google token. Configure OAuth or use the stub Google button in development.",
          );
        }

        const response = await completeGoogleOAuth(idToken, accessToken);
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
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      {error ? (
        <p className="text-destructive max-w-md text-center text-sm" role="alert">
          {error}
        </p>
      ) : (
        <>
          <Loader2 className="text-primary h-6 w-6 animate-spin" aria-hidden />
          <p className="text-muted-foreground text-sm">Completing Google sign-in…</p>
        </>
      )}
    </main>
  );
}
