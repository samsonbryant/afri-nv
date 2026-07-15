"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/features/auth/hooks/use-auth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants";

export function RegisterForm() {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      organizationName: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: RegisterInput) {
    registerMutation.mutate({
      fullName: values.fullName,
      email: values.email,
      organizationName: values.organizationName,
      password: values.password,
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
      noValidate
      aria-label="Create account"
    >
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Alex Morgan"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p id="fullName-error" className="text-destructive text-sm" role="alert">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
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

      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization</Label>
        <Input
          id="organizationName"
          autoComplete="organization"
          placeholder="Acme Inc."
          aria-invalid={!!errors.organizationName}
          aria-describedby={errors.organizationName ? "organizationName-error" : undefined}
          {...register("organizationName")}
        />
        {errors.organizationName ? (
          <p id="organizationName-error" className="text-destructive text-sm" role="alert">
            {errors.organizationName.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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

      <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href={ROUTES.login}
          className="text-primary focus-visible:ring-ring font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
