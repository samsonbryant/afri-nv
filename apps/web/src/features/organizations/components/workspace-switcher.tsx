"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOrganizations } from "@/features/organizations/hooks/use-organizations";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

type WorkspaceSwitcherProps = {
  compact?: boolean;
};

export function WorkspaceSwitcher({ compact = false }: WorkspaceSwitcherProps) {
  const { data, isLoading } = useOrganizations(true);
  const activeOrganizationId = useOrganizationsStore((state) => state.activeOrganizationId);
  const setActiveOrganizationId = useOrganizationsStore((state) => state.setActiveOrganizationId);
  const setOrganization = useAuthStore((state) => state.setOrganization);
  const currentOrg = useAuthStore((state) => state.organization);

  const orgs = data?.results ?? [];
  const active =
    orgs.find((org) => org.id === activeOrganizationId) ??
    orgs.find((org) => org.id === currentOrg?.id) ??
    orgs[0] ??
    currentOrg;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            "justify-between gap-2 font-normal",
            compact ? "max-w-[160px]" : "max-w-[220px]",
          )}
          aria-label="Switch workspace"
        >
          <span className="truncate">
            {isLoading ? "Loading…" : (active?.name ?? "Select workspace")}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.length === 0 ? (
          <div className="text-muted-foreground px-2 py-3 text-sm">No workspaces yet.</div>
        ) : (
          orgs.map((org) => {
            const selected = org.id === (active?.id ?? activeOrganizationId);
            return (
              <DropdownMenuItem
                key={org.id}
                onClick={() => {
                  setActiveOrganizationId(org.id);
                  setOrganization(org);
                }}
                className="justify-between"
              >
                <span className="truncate">{org.name}</span>
                {selected ? <Check className="text-primary h-4 w-4" aria-hidden /> : null}
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.onboarding}>Create workspace</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
