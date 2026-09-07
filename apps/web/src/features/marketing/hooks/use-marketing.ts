"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  connectSocialAccount,
  createFacebookAd,
  disconnectSocialAccount,
  fetchCampaigns,
  fetchFacebookAds,
  fetchMarketingAssets,
  fetchSocialConnections,
  fetchSocialPosts,
  generateMarketingAsset,
  publishSocialPost,
  refreshFacebookAdMetrics,
} from "@/features/marketing/api/marketing-api";
import type {
  ConnectSocialInput,
  CreateFacebookAdInput,
  GenerateMarketingInput,
  PublishSocialPostInput,
} from "@/features/marketing/types";
import { useMarketingStore } from "@/features/marketing/stores/marketing-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const marketingKeys = {
  all: ["marketing"] as const,
  assets: (orgId: string | null) => [...marketingKeys.all, "assets", orgId] as const,
  campaigns: (orgId: string | null) => [...marketingKeys.all, "campaigns", orgId] as const,
  connections: (orgId: string | null) => [...marketingKeys.all, "connections", orgId] as const,
  facebookAds: (orgId: string | null) => [...marketingKeys.all, "facebook-ads", orgId] as const,
  posts: (orgId: string | null) => [...marketingKeys.all, "posts", orgId] as const,
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

export function useSocialConnections() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: marketingKeys.connections(orgId),
    queryFn: () => fetchSocialConnections(orgId),
    enabled: Boolean(orgId),
    refetchInterval: 15_000,
  });
}

export function useConnectSocial() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConnectSocialInput) => connectSocialAccount(input, orgId),
    onSuccess: () => {
      toast.success("Connected and verified in realtime");
      void queryClient.invalidateQueries({ queryKey: marketingKeys.connections(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDisconnectSocial() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (connectionId: string) => disconnectSocialAccount(connectionId, orgId),
    onSuccess: () => {
      toast.success("Disconnected");
      void queryClient.invalidateQueries({ queryKey: marketingKeys.connections(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useFacebookAds() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: marketingKeys.facebookAds(orgId),
    queryFn: () => fetchFacebookAds(orgId),
    refetchInterval: 20_000,
  });
}

export function useCreateFacebookAd() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFacebookAdInput) => createFacebookAd(input, orgId),
    onSuccess: () => {
      toast.success("Facebook ad created");
      void queryClient.invalidateQueries({ queryKey: marketingKeys.facebookAds(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRefreshFacebookAd() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adId: string) => refreshFacebookAdMetrics(adId, orgId),
    onSuccess: () => {
      toast.success("Metrics refreshed");
      void queryClient.invalidateQueries({ queryKey: marketingKeys.facebookAds(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSocialPosts() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: marketingKeys.posts(orgId),
    queryFn: () => fetchSocialPosts(orgId),
    refetchInterval: 12_000,
  });
}

export function usePublishSocialPost() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PublishSocialPostInput) => publishSocialPost(input, orgId),
    onSuccess: () => {
      toast.success("Published across selected channels");
      void queryClient.invalidateQueries({ queryKey: marketingKeys.posts(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
