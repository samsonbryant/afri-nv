"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/features/auth/hooks/use-auth";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants";

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: ResetPasswordInput) {
    reset.mutate(values);
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-destructive text-sm" role="alert">
          Missing or invalid reset token. Request a new link.
        </p>
        <Button asChild variant="outline">
          <Link href={ROUTES.forgotPassword}>Forgot password</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
      aria-label="Reset password"
    >
      <input type="hidden" {...register("token")} />

      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" className="text-destructive text-sm" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <p id="confirmPassword-error" className="text-destructive text-sm" role="alert">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={reset.isPending}>
        {reset.isPending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
