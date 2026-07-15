"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAutomations } from "@/features/automations/api/automations-api";
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
  lists: () => [...automationKeys.all, "list"] as const,
};

export function useAutomations() {
  return useQuery({
    queryKey: automationKeys.lists(),
    queryFn: async () => {
      try {
        return await fetchAutomations();
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
