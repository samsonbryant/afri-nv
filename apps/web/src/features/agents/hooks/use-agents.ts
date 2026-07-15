"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAgentFromCatalog,
  fetchAgentCatalog,
  fetchAgentRuns,
  fetchAgents,
  runAgent,
} from "@/features/agents/api/agents-api";
import type { AgentCategory, RunAgentInput } from "@/features/agents/types";
import { useAgentsStore } from "@/features/agents/stores/agents-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const agentKeys = {
  all: ["agents"] as const,
  catalog: (orgId: string | null) => [...agentKeys.all, "catalog", orgId] as const,
  list: (orgId: string | null) => [...agentKeys.all, "list", orgId] as const,
  runs: (agentId: string, orgId: string | null) =>
    [...agentKeys.all, "runs", agentId, orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useAgentCatalog() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: agentKeys.catalog(orgId),
    queryFn: () => fetchAgentCatalog(orgId),
  });
}

export function useAgents() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: agentKeys.list(orgId),
    queryFn: () => fetchAgents(orgId),
  });
}

export function useAgentRuns(agentId: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: agentKeys.runs(agentId ?? "", orgId),
    queryFn: () => fetchAgentRuns(agentId!, orgId),
    enabled: Boolean(agentId),
  });
}

export function useCreateAgent() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const setSelectedAgentId = useAgentsStore((s) => s.setSelectedAgentId);
  return useMutation({
    mutationFn: (category: AgentCategory) => createAgentFromCatalog(category, orgId),
    onSuccess: (agent) => {
      toast.success(`${agent.name} ready`);
      setSelectedAgentId(agent.id);
      void queryClient.invalidateQueries({ queryKey: agentKeys.list(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRunAgent(agentId: string | null) {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RunAgentInput) => {
      if (!agentId) throw new Error("Select an agent first");
      return runAgent(agentId, input, orgId);
    },
    onSuccess: () => {
      toast.success("Agent run completed");
      if (agentId) {
        void queryClient.invalidateQueries({
          queryKey: agentKeys.runs(agentId, orgId),
        });
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
