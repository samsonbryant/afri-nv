"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchDashboardStats,
  fetchNotifications,
  getDemoDashboardStats,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "@/features/dashboard/api/dashboard-api";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (orgId: string | null) => [...dashboardKeys.all, "stats", orgId] as const,
  notifications: () => [...dashboardKeys.all, "notifications"] as const,
};

export function useDashboardStats() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: dashboardKeys.stats(orgId),
    enabled: Boolean(orgId),
    queryFn: async () => {
      try {
        return await fetchDashboardStats(orgId);
      } catch (error) {
        if (error instanceof TypeError || (error instanceof ApiError && error.status >= 500)) {
          return getDemoDashboardStats();
        }
        throw error;
      }
    },
  });
}

export function useNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: dashboardKeys.notifications(),
    enabled: isAuthenticated,
    queryFn: fetchNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationReadRequest(id),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.notifications() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsReadRequest(),
    onSuccess: () => {
      toast.success("All notifications marked read");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.notifications() });
    },
  });
}
