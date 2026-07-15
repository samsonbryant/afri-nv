"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialButtons } from "@/features/auth/components/social-buttons";
import { useForgotPassword } from "@/features/auth/hooks/use-auth";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants";

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    forgot.mutate(values);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
      aria-label="Forgot password"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p id="email-error" className="text-destructive text-sm" role="alert">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={forgot.isPending}>
        {forgot.isPending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Remembered your password?{" "}
        <Link
          href={ROUTES.login}
          className="text-primary focus-visible:ring-ring font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2"
        >
          Sign in
        </Link>
      </p>

      <SocialButtons />
    </form>
  );
}
