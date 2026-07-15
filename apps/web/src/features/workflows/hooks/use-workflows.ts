"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWorkflows } from "@/features/workflows/api/workflows-api";
import type { PaginatedResponse, Workflow } from "@/types/api";
import { ApiError } from "@/lib/api/errors";

const EMPTY_WORKFLOWS: PaginatedResponse<Workflow> = {
  count: 0,
  next: null,
  previous: null,
  results: [],
};

export const workflowKeys = {
  all: ["workflows"] as const,
  lists: () => [...workflowKeys.all, "list"] as const,
  detail: (id: string) => [...workflowKeys.all, "detail", id] as const,
};

export function useWorkflows() {
  return useQuery({
    queryKey: workflowKeys.lists(),
    queryFn: async () => {
      try {
        return await fetchWorkflows();
      } catch (error) {
        if (
          error instanceof TypeError ||
          (error instanceof ApiError && (error.status >= 500 || error.isNotFound))
        ) {
          return EMPTY_WORKFLOWS;
        }
        throw error;
      }
    },
  });
}
