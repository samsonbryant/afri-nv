"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAcceptInvite } from "@/features/organizations/hooks/use-organizations";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { ROUTES } from "@/lib/constants";

type InviteAcceptPanelProps = {
  token: string;
};

export function InviteAcceptPanel({ token }: InviteAcceptPanelProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accept = useAcceptInvite();

  useEffect(() => {
    if (!token || !isAuthenticated) return;
    accept.mutate(token, {
      onSuccess: () => {
        router.replace(ROUTES.dashboard);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAuthenticated]);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive text-sm" role="alert">
          Missing invite token.
        </p>
        <Button asChild variant="outline">
          <Link href={ROUTES.login}>Go to sign in</Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    const next = `${ROUTES.invite}?token=${encodeURIComponent(token)}`;
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground text-sm">
          Sign in or create an account to accept this invitation.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href={`${ROUTES.login}?next=${encodeURIComponent(next)}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${ROUTES.register}?next=${encodeURIComponent(next)}`}>Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (accept.isError) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive text-sm" role="alert">
          This invite could not be accepted. It may have expired.
        </p>
        <Button asChild>
          <Link href={ROUTES.dashboard}>Go to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">Accepting invitation…</p>
    </div>
  );
}
