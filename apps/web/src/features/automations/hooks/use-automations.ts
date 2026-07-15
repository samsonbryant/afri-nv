"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAutomations } from "@/features/automations/api/automations-api";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import type { Automation, PaginatedResponse } from "@/types/api";
import { ApiError } from "@/lib/api/errors";

const EMPTY: PaginatedResponse<Automation> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const automationKeys = {
  all: ["automations"] as const,
  lists: (orgId: string | null) => [...automationKeys.all, "list", orgId] as const,
};

export function useAutomations() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: automationKeys.lists(orgId),
    enabled: Boolean(orgId),
    queryFn: async () => {
      try {
        return await fetchAutomations(orgId);
      } catch (error) {
        if (
          error instanceof TypeError ||
          (error instanceof ApiError && (error.status >= 500 || error.isNotFound))
        ) {
          return EMPTY;
        }
        throw error;
      }
    },
  });
}
