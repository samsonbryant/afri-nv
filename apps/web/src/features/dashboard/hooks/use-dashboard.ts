"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, getDemoDashboardStats } from "@/features/dashboard/api/dashboard-api";
import { ApiError } from "@/lib/api/errors";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      try {
        return await fetchDashboardStats();
      } catch (error) {
        if (error instanceof TypeError || (error instanceof ApiError && error.status >= 500)) {
          return getDemoDashboardStats();
        }
        throw error;
      }
    },
  });
}
