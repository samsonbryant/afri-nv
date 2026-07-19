"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveAdminManualPayment,
  createAdminUser,
  fetchAdminAiUsage,
  fetchAdminAuditLogs,
  fetchAdminManualPayments,
  fetchAdminOrganizations,
  fetchAdminOverview,
  fetchAdminPayments,
  fetchAdminSettings,
  fetchAdminSubscriptions,
  fetchAdminUsers,
  rejectAdminManualPayment,
  updateAdminSettings,
  updateAdminUser,
} from "@/features/admin/api/admin-api";
import type { CreateAdminUserInput, UpdateAdminUserInput } from "@/features/admin/types";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

export const adminKeys = {
  all: ["admin"] as const,
  overview: () => [...adminKeys.all, "overview"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  organizations: () => [...adminKeys.all, "organizations"] as const,
  subscriptions: () => [...adminKeys.all, "subscriptions"] as const,
  payments: () => [...adminKeys.all, "payments"] as const,
  aiUsage: () => [...adminKeys.all, "ai-usage"] as const,
  auditLogs: () => [...adminKeys.all, "audit-logs"] as const,
  settings: () => [...adminKeys.all, "settings"] as const,
  manualPayments: () => [...adminKeys.all, "manual-payments"] as const,
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

export function useAdminOverview() {
  return useAdminQuery(adminKeys.overview(), fetchAdminOverview);
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

export function useAdminManualPayments() {
  return useAdminQuery(adminKeys.manualPayments(), () => fetchAdminManualPayments());
}

export function useApproveManualPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveAdminManualPayment(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.manualPayments() });
      void qc.invalidateQueries({ queryKey: adminKeys.subscriptions() });
      void qc.invalidateQueries({ queryKey: adminKeys.overview() });
      toast.success("Payment approved — subscription activated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRejectManualPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectAdminManualPayment(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.manualPayments() });
      toast.success("Payment rejected");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminUserInput) => createAdminUser(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void qc.invalidateQueries({ queryKey: adminKeys.overview() });
      toast.success("User created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAdminUserInput }) =>
      updateAdminUser(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.users() });
      void qc.invalidateQueries({ queryKey: adminKeys.overview() });
      toast.success("User updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAdminSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.settings() });
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
