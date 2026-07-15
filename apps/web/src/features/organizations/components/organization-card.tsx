"use client";

import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuthStore } from "@/features/auth/stores/auth-store";

export function OrganizationCard() {
  const organization = useAuthStore((state) => state.organization);

  if (!organization) {
    return (
      <EmptyState
        icon={Building2}
        title="No organization"
        description="Join or create an organization to collaborate with your team."
      />
    );
  }

  return (
    <div className="border-border bg-card rounded-xl border p-5">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Building2 className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="font-medium">{organization.name}</h3>
          <p className="text-muted-foreground text-sm">Role: {organization.role ?? "member"}</p>
        </div>
      </div>
    </div>
  );
}
