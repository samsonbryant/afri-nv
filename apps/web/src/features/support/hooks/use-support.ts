"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchChannels,
  fetchSupportStats,
  fetchTicketMessages,
  fetchTickets,
  generateAiReply,
  replyToTicket,
} from "@/features/support/api/support-api";
import { useSupportStore } from "@/features/support/stores/support-store";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const supportKeys = {
  all: ["support"] as const,
  channels: (orgId: string | null) => [...supportKeys.all, "channels", orgId] as const,
  tickets: (orgId: string | null, channelId: string | null) =>
    [...supportKeys.all, "tickets", orgId, channelId] as const,
  messages: (ticketId: string | null, orgId: string | null) =>
    [...supportKeys.all, "messages", ticketId, orgId] as const,
  stats: (orgId: string | null) => [...supportKeys.all, "stats", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((state) => state.activeOrganizationId);
  const authOrgId = useAuthStore((state) => state.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useSupportChannels() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: supportKeys.channels(orgId),
    queryFn: () => fetchChannels(orgId),
  });
}

export function useSupportTickets() {
  const orgId = useOrgId();
  const channelId = useSupportStore((s) => s.selectedChannelId);
  return useQuery({
    queryKey: supportKeys.tickets(orgId, channelId),
    queryFn: () => fetchTickets(orgId, channelId),
  });
}

export function useTicketMessages(ticketId: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: supportKeys.messages(ticketId, orgId),
    queryFn: () => fetchTicketMessages(ticketId!, orgId),
    enabled: Boolean(ticketId),
  });
}

/** Alias used by SupportInbox */
export const useSupportMessages = useTicketMessages;

export function useSupportStats() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: supportKeys.stats(orgId),
    queryFn: () => fetchSupportStats(orgId),
  });
}

export function useReplyToTicket() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const setReplyDraft = useSupportStore((s) => s.setReplyDraft);
  const channelId = useSupportStore((s) => s.selectedChannelId);

  return useMutation({
    mutationFn: ({
      ticketId,
      content,
      payload,
    }: {
      ticketId: string;
      content?: string;
      payload?: { content: string };
    }) => replyToTicket(ticketId, content ?? payload?.content ?? "", orgId),
    onSuccess: (_data, vars) => {
      setReplyDraft("");
      void queryClient.invalidateQueries({
        queryKey: supportKeys.messages(vars.ticketId, orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: supportKeys.tickets(orgId, channelId),
      });
      void queryClient.invalidateQueries({
        queryKey: supportKeys.stats(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAiReply() {
  const orgId = useOrgId();
  const setReplyDraft = useSupportStore((s) => s.setReplyDraft);

  return useMutation({
    mutationFn: (ticketId: string) => generateAiReply(ticketId, orgId),
    onSuccess: (data) => {
      setReplyDraft(data.suggestion);
      toast.success("AI reply drafted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
