"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createConversation,
  deleteConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
  uploadAssistantFile,
} from "@/features/assistant/api/assistant-api";
import { useAssistantStore } from "@/features/assistant/stores/assistant-store";
import type { SendMessagePayload } from "@/features/assistant/types";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import { getErrorMessage } from "@/lib/api/errors";

export const assistantKeys = {
  all: ["assistant"] as const,
  conversations: (orgId: string | null) => [...assistantKeys.all, "conversations", orgId] as const,
  messages: (id: string | null, orgId: string | null) =>
    [...assistantKeys.all, "messages", id, orgId] as const,
};

export function useConversations() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: assistantKeys.conversations(orgId),
    queryFn: () => fetchConversations(orgId),
    enabled: Boolean(orgId),
  });
}

export function useMessages(conversationId: string | null) {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: assistantKeys.messages(conversationId, orgId),
    queryFn: () => fetchMessages(conversationId!, orgId),
    enabled: Boolean(conversationId && orgId),
  });
}

export function useCreateConversation() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  const setActiveConversationId = useAssistantStore((state) => state.setActiveConversationId);

  return useMutation({
    mutationFn: () => createConversation("New chat", orgId),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id);
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.conversations(orgId),
      });
    },
  });
}

export function useSendMessage() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  const setActiveConversationId = useAssistantStore((state) => state.setActiveConversationId);
  const clearPendingAttachments = useAssistantStore((state) => state.clearPendingAttachments);
  const setDraft = useAssistantStore((state) => state.setDraft);

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendMessage(payload, orgId),
    onSuccess: (data) => {
      setActiveConversationId(data.conversation.id);
      setDraft("");
      clearPendingAttachments();
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.conversations(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.messages(data.conversation.id, orgId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUploadAssistantFile() {
  const orgId = useActiveOrganizationId();
  return useMutation({
    mutationFn: (file: File) => uploadAssistantFile(file, orgId),
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteConversation() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  const activeId = useAssistantStore((state) => state.activeConversationId);
  const setActiveConversationId = useAssistantStore((state) => state.setActiveConversationId);

  return useMutation({
    mutationFn: (id: string) => deleteConversation(id, orgId),
    onSuccess: (_data, id) => {
      if (activeId === id) setActiveConversationId(null);
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.conversations(orgId),
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
