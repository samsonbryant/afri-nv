"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createApiKey,
  createWebhook,
  deleteWebhook,
  fetchApiKeys,
  fetchWebhooks,
  revokeApiKey,
  updateWebhook,
} from "@/features/developer/api/developer-api";
import { useDeveloperStore } from "@/features/developer/stores/developer-store";
import type { CreateApiKeyInput, CreateWebhookInput } from "@/features/developer/types";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const developerKeys = {
  all: ["developer"] as const,
  apiKeys: (orgId: string | null) => [...developerKeys.all, "api-keys", orgId] as const,
  webhooks: (orgId: string | null) => [...developerKeys.all, "webhooks", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useApiKeys() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: developerKeys.apiKeys(orgId),
    queryFn: () => fetchApiKeys(orgId),
  });
}

export function useCreateApiKey() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const setLastCreatedSecret = useDeveloperStore((s) => s.setLastCreatedSecret);
  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => createApiKey(input, orgId),
    onSuccess: (key) => {
      if (key.secret) setLastCreatedSecret(key.secret);
      void queryClient.invalidateQueries({
        queryKey: developerKeys.apiKeys(orgId),
      });
      toast.success("API key created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRevokeApiKey() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeApiKey(id, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: developerKeys.apiKeys(orgId),
      });
      toast.success("API key revoked");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useWebhooks() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: developerKeys.webhooks(orgId),
    queryFn: () => fetchWebhooks(orgId),
  });
}

export function useCreateWebhook() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWebhookInput) => createWebhook(input, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: developerKeys.webhooks(orgId),
      });
      toast.success("Webhook created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateWebhook() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & Partial<CreateWebhookInput> & { active?: boolean }) =>
      updateWebhook(id, input, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: developerKeys.webhooks(orgId),
      });
      toast.success("Webhook updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteWebhook() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWebhook(id, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: developerKeys.webhooks(orgId),
      });
      toast.success("Webhook deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
