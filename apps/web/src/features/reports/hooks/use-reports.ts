"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchReportTemplates,
  fetchReports,
  generateReport,
} from "@/features/reports/api/reports-api";
import type { GenerateReportPayload } from "@/features/reports/types";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import { getErrorMessage } from "@/lib/api/errors";
import { useReportsStore } from "@/features/reports/stores/reports-store";

export const reportKeys = {
  all: ["reports"] as const,
  templates: () => [...reportKeys.all, "templates"] as const,
  list: (orgId?: string | null) => [...reportKeys.all, "list", orgId ?? "none"] as const,
  detail: (id: string) => [...reportKeys.all, "detail", id] as const,
};

export function useReportTemplates() {
  return useQuery({
    queryKey: reportKeys.templates(),
    queryFn: fetchReportTemplates,
    staleTime: 1000 * 60 * 10,
  });
}

export function useReports() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: reportKeys.list(orgId),
    queryFn: () => fetchReports(orgId),
  });
}

export function useGenerateReport() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  const setActiveReport = useReportsStore((s) => s.setActiveReport);
  const setGenerateDialogOpen = useReportsStore((s) => s.setGenerateDialogOpen);

  return useMutation({
    mutationFn: (payload: Omit<GenerateReportPayload, "organizationId">) =>
      generateReport({ ...payload, organizationId: orgId }),
    onSuccess: (report) => {
      toast.success("Report generated");
      setActiveReport(report);
      setGenerateDialogOpen(false);
      void queryClient.invalidateQueries({ queryKey: reportKeys.list(orgId) });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
