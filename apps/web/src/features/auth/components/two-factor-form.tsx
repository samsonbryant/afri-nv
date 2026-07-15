"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVerifyTwoFactor } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { twoFactorSchema, type TwoFactorInput } from "@/lib/validations/auth";

export function TwoFactorForm() {
  const verify = useVerifyTwoFactor();
  const pendingTwoFactorToken = useAuthStore((state) => state.pendingTwoFactorToken);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorInput>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: { code: "" },
  });

  function onSubmit(values: TwoFactorInput) {
    verify.mutate({
      code: values.code,
      twoFactorToken: pendingTwoFactorToken ?? undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
      aria-label="Two-factor authentication"
    >
      <div className="space-y-2">
        <Label htmlFor="code">Authentication code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          aria-invalid={!!errors.code}
          aria-describedby={errors.code ? "code-error" : "code-help"}
          {...register("code")}
        />
        <p id="code-help" className="text-muted-foreground text-xs">
          Enter the 6-digit code from your authenticator app.
        </p>
        {errors.code ? (
          <p id="code-error" className="text-destructive text-sm" role="alert">
            {errors.code.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={verify.isPending}>
        {verify.isPending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Verifying…
          </>
        ) : (
          "Verify"
        )}
      </Button>
    </form>
  );
}
