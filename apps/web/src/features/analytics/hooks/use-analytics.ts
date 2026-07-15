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
  return useQuery({
    queryKey: analyticsKeys.overview(orgId),
    queryFn: () => fetchAnalyticsOverview(orgId),
  });
}
