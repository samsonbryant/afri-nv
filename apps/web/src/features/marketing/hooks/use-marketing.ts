"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchCampaigns,
  fetchMarketingAssets,
  generateMarketingAsset,
} from "@/features/marketing/api/marketing-api";
import type { GenerateMarketingInput } from "@/features/marketing/types";
import { useMarketingStore } from "@/features/marketing/stores/marketing-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const marketingKeys = {
  all: ["marketing"] as const,
  assets: (orgId: string | null) => [...marketingKeys.all, "assets", orgId] as const,
  campaigns: (orgId: string | null) => [...marketingKeys.all, "campaigns", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((state) => state.activeOrganizationId);
  const authOrgId = useAuthStore((state) => state.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useMarketingAssets() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: marketingKeys.assets(orgId),
    queryFn: () => fetchMarketingAssets(orgId),
  });
}

export function useCampaigns() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: marketingKeys.campaigns(orgId),
    queryFn: () => fetchCampaigns(orgId),
  });
}

export function useGenerateMarketingAsset() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const setPrompt = useMarketingStore((s) => s.setPrompt);

  return useMutation({
    mutationFn: (input: GenerateMarketingInput) => generateMarketingAsset(input, orgId),
    onSuccess: () => {
      toast.success("Content generated");
      setPrompt("");
      void queryClient.invalidateQueries({
        queryKey: marketingKeys.assets(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
