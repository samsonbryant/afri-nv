"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrganization } from "@/features/organizations/hooks/use-organizations";
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/auth";
import { ROUTES } from "@/lib/constants";
import { useAuthStore } from "@/features/auth/stores/auth-store";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function OnboardingForm() {
  const router = useRouter();
  const organization = useAuthStore((state) => state.organization);
  const createOrg = useCreateOrganization();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  const name = watch("name");
  const suggestedSlug = useMemo(() => slugify(name || ""), [name]);

  useEffect(() => {
    if (organization) {
      router.replace(ROUTES.dashboard);
    }
  }, [organization, router]);

  useEffect(() => {
    setValue("slug", suggestedSlug);
  }, [suggestedSlug, setValue]);

  function onSubmit(values: OnboardingInput) {
    createOrg.mutate(
      {
        name: values.name.trim(),
        slug: (values.slug || suggestedSlug).trim() || slugify(values.name),
      },
      {
        onSuccess: () => router.push(ROUTES.dashboard),
      },
    );
  }

  return (
    <div className="border-border bg-card mx-auto w-full max-w-md space-y-6 rounded-2xl border p-6 shadow-sm sm:p-8">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Create your workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          A workspace is where your team runs workflows and automations.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-label="Create workspace"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Workspace name</Label>
          <Input
            id="name"
            placeholder="Acme Inc."
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="name-error" className="text-destructive text-sm" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">URL slug</Label>
          <Input
            id="slug"
            placeholder="acme-inc"
            aria-invalid={!!errors.slug}
            aria-describedby={errors.slug ? "slug-error" : undefined}
            {...register("slug")}
          />
          {errors.slug ? (
            <p id="slug-error" className="text-destructive text-sm" role="alert">
              {errors.slug.message}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={createOrg.isPending}>
          {createOrg.isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Creating…
            </>
          ) : (
            "Continue"
          )}
        </Button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <div className="bg-background flex min-h-screen items-center justify-center px-4 py-10">
        <div className="bg-teal-glow pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="relative z-10 w-full">
          <OnboardingForm />
        </div>
      </div>
    </AuthGuard>
  );
}
