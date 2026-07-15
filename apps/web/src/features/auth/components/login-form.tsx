"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/features/auth/hooks/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginInput) {
    login.mutate(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate aria-label="Sign in">
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
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

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.register}
          className="text-primary focus-visible:ring-ring font-medium underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
