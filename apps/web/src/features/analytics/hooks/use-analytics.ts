"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnalyticsOverview } from "@/features/analytics/api/analytics-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: (orgId: string | null) => [...analyticsKeys.all, "overview", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useAnalyticsOverview() {
  const orgId = useOrgId();
  const accessToken = useAuthStore((state) => state.accessToken);
  const canFetch = Boolean(orgId) && Boolean(accessToken) && !accessToken?.startsWith("demo-");
  return useQuery({
    queryKey: analyticsKeys.overview(orgId),
    queryFn: () => fetchAnalyticsOverview(orgId),
    enabled: canFetch,
    retry: (failureCount, error) => {
      const status = (error as { status?: number })?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
