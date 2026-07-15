"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminAiUsage,
  fetchAdminAuditLogs,
  fetchAdminOrganizations,
  fetchAdminPayments,
  fetchAdminSettings,
  fetchAdminSubscriptions,
  fetchAdminUsers,
} from "@/features/admin/api/admin-api";
import { ApiError } from "@/lib/api/errors";

export const adminKeys = {
  all: ["admin"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  organizations: () => [...adminKeys.all, "organizations"] as const,
  subscriptions: () => [...adminKeys.all, "subscriptions"] as const,
  payments: () => [...adminKeys.all, "payments"] as const,
  aiUsage: () => [...adminKeys.all, "ai-usage"] as const,
  auditLogs: () => [...adminKeys.all, "audit-logs"] as const,
  settings: () => [...adminKeys.all, "settings"] as const,
};

function useAdminQuery<T>(key: readonly unknown[], queryFn: () => Promise<T>) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        if (error instanceof ApiError && error.isForbidden) throw error;
        throw error;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isForbidden) return false;
      return failureCount < 1;
    },
  });
}

export function useAdminUsers() {
  return useAdminQuery(adminKeys.users(), fetchAdminUsers);
}

export function useAdminOrganizations() {
  return useAdminQuery(adminKeys.organizations(), fetchAdminOrganizations);
}

export function useAdminSubscriptions() {
  return useAdminQuery(adminKeys.subscriptions(), fetchAdminSubscriptions);
}

export function useAdminPayments() {
  return useAdminQuery(adminKeys.payments(), fetchAdminPayments);
}

export function useAdminAiUsage() {
  return useAdminQuery(adminKeys.aiUsage(), fetchAdminAiUsage);
}

export function useAdminAuditLogs() {
  return useAdminQuery(adminKeys.auditLogs(), fetchAdminAuditLogs);
}

export function useAdminSettings() {
  return useAdminQuery(adminKeys.settings(), fetchAdminSettings);
}
