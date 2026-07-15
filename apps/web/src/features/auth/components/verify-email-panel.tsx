"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVerifyEmail } from "@/features/auth/hooks/use-auth";
import { getErrorMessage } from "@/lib/api/errors";
import { ROUTES } from "@/lib/constants";

type VerifyEmailPanelProps = {
  token: string;
};

export function VerifyEmailPanel({ token }: VerifyEmailPanelProps) {
  const verify = useVerifyEmail();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token.");
      return;
    }

    verify.mutate(
      { token },
      {
        onSuccess: (data) => {
          setStatus("success");
          setMessage(data.detail ?? "Your email has been verified.");
        },
        onError: (error) => {
          setStatus("error");
          setMessage(getErrorMessage(error));
        },
      },
    );
    // Run once on mount for the provided token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token || status === "error") {
    return (
      <div className="space-y-4 text-center">
        <XCircle className="text-destructive mx-auto h-10 w-10" aria-hidden />
        <p className="text-destructive text-sm" role="alert">
          {message || "Unable to verify email."}
        </p>
        <Button asChild>
          <Link href={ROUTES.login}>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="text-primary mx-auto h-10 w-10" aria-hidden />
        <p className="text-muted-foreground text-sm">{message}</p>
        <Button asChild>
          <Link href={ROUTES.login}>Continue to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Loader2 className="text-primary h-8 w-8 animate-spin" aria-hidden />
      <p className="text-muted-foreground text-sm">Verifying your email…</p>
    </div>
  );
}
