"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { Copy, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useLogin } from "@/features/auth/hooks/use-auth";
import { ADMIN_BOOTSTRAP } from "@/config/services";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";

export function LoginForm() {
  const login = useLogin();
  const [showAdmin, setShowAdmin] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
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

  function fillAdmin() {
    setValue("email", ADMIN_BOOTSTRAP.email, { shouldValidate: true });
    setValue("password", ADMIN_BOOTSTRAP.password, { shouldValidate: true });
    setShowAdmin(true);
    toast.message("Admin credentials filled — change the password after first login.");
  }

  async function copyAdmin() {
    try {
      await navigator.clipboard.writeText(`${ADMIN_BOOTSTRAP.email}\n${ADMIN_BOOTSTRAP.password}`);
      toast.success("Admin credentials copied");
    } catch {
      toast.error("Could not copy credentials");
    }
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link
            href={ROUTES.forgotPassword}
            className="text-muted-foreground hover:text-primary text-xs font-medium underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
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

      <div className="border-border/80 bg-muted/40 rounded-xl border p-3">
        <button
          type="button"
          className="text-foreground flex w-full items-center justify-between gap-2 text-left text-sm font-medium"
          onClick={() => setShowAdmin((v) => !v)}
          aria-expanded={showAdmin}
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="text-primary h-4 w-4" aria-hidden />
            Admin login details
          </span>
          <span className="text-muted-foreground text-xs">{showAdmin ? "Hide" : "Show"}</span>
        </button>
        {showAdmin ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="text-muted-foreground text-xs">{ADMIN_BOOTSTRAP.note}</p>
            <div className="bg-background/80 rounded-lg border px-3 py-2 font-mono text-xs leading-relaxed">
              <div>
                <span className="text-muted-foreground">Email:</span> {ADMIN_BOOTSTRAP.email}
              </div>
              <div>
                <span className="text-muted-foreground">Password:</span> {ADMIN_BOOTSTRAP.password}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={fillAdmin}>
                Fill form
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void copyAdmin()}>
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy
              </Button>
            </div>
          </div>
        ) : null}
      </div>

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
