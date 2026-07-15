"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSecurityOverview, triggerBackup } from "@/features/security/api/security-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const securityKeys = {
  all: ["security"] as const,
  overview: (orgId: string | null) => [...securityKeys.all, "overview", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useSecurityOverview() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: securityKeys.overview(orgId),
    queryFn: () => fetchSecurityOverview(orgId),
  });
}

export function useTriggerBackup() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => triggerBackup(orgId),
    onSuccess: (result) => {
      toast.success(result.message);
      void queryClient.invalidateQueries({
        queryKey: securityKeys.overview(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
