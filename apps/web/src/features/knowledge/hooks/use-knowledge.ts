"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteKnowledgeDocument,
  fetchDocumentChunks,
  fetchKnowledgeConversations,
  fetchKnowledgeDocuments,
  fetchKnowledgeMessages,
  sendKnowledgeChat,
  uploadKnowledgeDocument,
} from "@/features/knowledge/api/knowledge-api";
import { useKnowledgeStore } from "@/features/knowledge/stores/knowledge-store";
import type { KnowledgeChatPayload } from "@/features/knowledge/types";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const knowledgeKeys = {
  all: ["knowledge"] as const,
  documents: (orgId: string | null) => [...knowledgeKeys.all, "documents", orgId] as const,
  chunks: (docId: string | null, orgId: string | null) =>
    [...knowledgeKeys.all, "chunks", docId, orgId] as const,
  conversations: (orgId: string | null) => [...knowledgeKeys.all, "conversations", orgId] as const,
  messages: (id: string | null, orgId: string | null) =>
    [...knowledgeKeys.all, "messages", id, orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((state) => state.activeOrganizationId);
  const authOrgId = useAuthStore((state) => state.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useKnowledgeDocuments() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: knowledgeKeys.documents(orgId),
    queryFn: () => fetchKnowledgeDocuments(orgId),
  });
}

export function useDocumentChunks(documentId: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: knowledgeKeys.chunks(documentId, orgId),
    queryFn: () => fetchDocumentChunks(documentId!, orgId),
    enabled: Boolean(documentId),
  });
}

export function useKnowledgeConversations() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: knowledgeKeys.conversations(orgId),
    queryFn: () => fetchKnowledgeConversations(orgId),
  });
}

export function useKnowledgeMessages(conversationId: string | null) {
  const orgId = useOrgId();
  return useQuery({
    queryKey: knowledgeKeys.messages(conversationId, orgId),
    queryFn: () => fetchKnowledgeMessages(conversationId!, orgId),
    enabled: Boolean(conversationId),
  });
}

export function useUploadKnowledgeDocument() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadKnowledgeDocument(file, orgId),
    onSuccess: () => {
      toast.success("Document uploaded");
      void queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteKnowledgeDocument() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const selectedId = useKnowledgeStore((s) => s.selectedDocumentId);
  const setSelectedDocumentId = useKnowledgeStore((s) => s.setSelectedDocumentId);

  return useMutation({
    mutationFn: (id: string) => deleteKnowledgeDocument(id, orgId),
    onSuccess: (_data, id) => {
      if (selectedId === id) setSelectedDocumentId(null);
      toast.success("Document deleted");
      void queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSendKnowledgeChat() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const setActiveConversationId = useKnowledgeStore((s) => s.setActiveConversationId);
  const setDraft = useKnowledgeStore((s) => s.setDraft);

  return useMutation({
    mutationFn: (payload: KnowledgeChatPayload) => sendKnowledgeChat(payload, orgId),
    onSuccess: (data) => {
      setActiveConversationId(data.conversation.id);
      setDraft("");
      void queryClient.invalidateQueries({
        queryKey: knowledgeKeys.conversations(orgId),
      });
      void queryClient.invalidateQueries({
        queryKey: knowledgeKeys.messages(data.conversation.id, orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
