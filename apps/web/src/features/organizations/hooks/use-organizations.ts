"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  acceptInviteRequest,
  createOrganizationRequest,
  fetchMemberships,
  fetchOrganizations,
  inviteMemberRequest,
  normalizeOrganization,
  removeMembershipRequest,
} from "@/features/organizations/api/organizations-api";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { unwrapList } from "@/lib/api/org";
import { getErrorMessage } from "@/lib/api/errors";
import type { InviteMemberInput } from "@/lib/validations/auth";
import type { Organization } from "@/types/api";

export const organizationKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationKeys.all, "list"] as const,
  memberships: (orgId: string | null) => [...organizationKeys.all, "memberships", orgId] as const,
};

export function useOrganizations(forceEnabled?: boolean) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const canQuery =
    Boolean(accessToken) && !accessToken?.startsWith("demo-") && (forceEnabled ?? isAuthenticated);
  return useQuery({
    queryKey: organizationKeys.lists(),
    enabled: canQuery,
    queryFn: async () => {
      const payload = await fetchOrganizations();
      const results = unwrapList(
        payload as unknown as Organization[] | { results?: Organization[] },
      );
      return {
        count: Array.isArray(payload)
          ? payload.length
          : ((payload as { count?: number }).count ?? results.length),
        next: null,
        previous: null,
        results: results.map((item) =>
          normalizeOrganization(item as unknown as Record<string, unknown>),
        ),
      };
    },
  });
}

/** Active workspace id from store, falling back to the auth session org. */
export function useActiveOrganizationId(): string | null {
  const storeId = useOrganizationsStore((state) => state.activeOrganizationId);
  const authOrgId = useAuthStore((state) => state.organization?.id ?? null);
  const setActive = useOrganizationsStore((state) => state.setActiveOrganizationId);
  const { data } = useOrganizations();

  const resolved = useMemo(() => {
    if (storeId) return storeId;
    if (authOrgId) return authOrgId;
    return data?.results?.[0]?.id ?? null;
  }, [storeId, authOrgId, data?.results]);

  useEffect(() => {
    if (!storeId && resolved) {
      setActive(resolved);
    }
  }, [storeId, resolved, setActive]);

  return resolved;
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const setOrganization = useAuthStore((state) => state.setOrganization);
  const setActive = useOrganizationsStore((state) => state.setActiveOrganizationId);

  return useMutation({
    mutationFn: (payload: { name: string; slug: string }) => createOrganizationRequest(payload),
    onSuccess: (org) => {
      setOrganization(org);
      setActive(org.id);
      toast.success("Workspace created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

export function useMemberships(organizationId: string | null) {
  return useQuery({
    queryKey: organizationKeys.memberships(organizationId),
    enabled: Boolean(organizationId),
    queryFn: () => fetchMemberships(organizationId!),
  });
}

export function useInviteMember(organizationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InviteMemberInput) => {
      if (!organizationId) {
        throw new Error("Select a workspace before inviting members.");
      }
      return inviteMemberRequest(organizationId, values);
    },
    onSuccess: () => {
      toast.success("Invite sent");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.memberships(organizationId),
      });
    },
  });
}

export function useRemoveMembership(organizationId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => {
      if (!organizationId) {
        throw new Error("Select a workspace first.");
      }
      return removeMembershipRequest(organizationId, membershipId);
    },
    onSuccess: () => {
      toast.success("Member removed");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: organizationKeys.memberships(organizationId),
      });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  const setOrganization = useAuthStore((state) => state.setOrganization);
  const setActive = useOrganizationsStore((state) => state.setActiveOrganizationId);

  return useMutation({
    mutationFn: (token: string) => acceptInviteRequest(token),
    onSuccess: (org) => {
      if (org) {
        setOrganization(org);
        setActive(org.id);
      }
      toast.success("Invitation accepted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}
