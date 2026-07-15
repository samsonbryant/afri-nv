"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createWorkflowDetail,
  fetchWorkflowDetail,
  fetchWorkflowList,
  publishWorkflow,
  runWorkflow,
  saveWorkflowDefinition,
  validateWorkflow,
} from "@/features/workflow-builder/api/workflow-builder-api";
import type { WorkflowDefinition } from "@/features/workflow-builder/types";
import type { CreateWorkflowInput } from "@/lib/validations/workflow";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const workflowBuilderKeys = {
  all: ["workflow-builder"] as const,
  list: (orgId: string | null) => [...workflowBuilderKeys.all, "list", orgId] as const,
  detail: (id: string, orgId: string | null) =>
    [...workflowBuilderKeys.all, "detail", id, orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useWorkflowList() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: workflowBuilderKeys.list(orgId),
    queryFn: () => fetchWorkflowList(orgId),
  });
}

export function useWorkflowDetail(id: string) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: workflowBuilderKeys.detail(id, orgId),
    queryFn: () => fetchWorkflowDetail(id, orgId),
    enabled: Boolean(id),
  });
}

export function useCreateWorkflow() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => createWorkflowDetail(input, orgId),
    onSuccess: () => {
      toast.success("Workflow created");
      void queryClient.invalidateQueries({
        queryKey: workflowBuilderKeys.list(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSaveDefinition(id: string) {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (definition: WorkflowDefinition) => saveWorkflowDefinition(id, definition, orgId),
    onSuccess: () => {
      toast.success("Definition saved");
      void queryClient.invalidateQueries({
        queryKey: workflowBuilderKeys.detail(id, orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: workflowBuilderKeys.list(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useValidateWorkflow(id: string) {
  const orgId = useOrgId();
  return useMutation({
    mutationFn: (definition: WorkflowDefinition) => validateWorkflow(id, definition, orgId),
    onSuccess: (result) => {
      if (result.valid) toast.success("Workflow is valid");
      else toast.error(result.errors.join("; ") || "Validation failed");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePublishWorkflow(id: string) {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => publishWorkflow(id, orgId),
    onSuccess: (result) => {
      toast.success(result.message ?? "Published");
      void queryClient.invalidateQueries({
        queryKey: workflowBuilderKeys.detail(id, orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: workflowBuilderKeys.list(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRunWorkflow(id: string) {
  const orgId = useOrgId();
  return useMutation({
    mutationFn: () => runWorkflow(id, orgId),
    onSuccess: (result) => {
      toast.success(result.message ?? `Run ${result.status}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
