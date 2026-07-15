"use client";

import { create } from "zustand";

type AssistantStore = {
  activeConversationId: string | null;
  draft: string;
  pendingAttachmentIds: string[];
  setActiveConversationId: (id: string | null) => void;
  setDraft: (draft: string) => void;
  addPendingAttachmentId: (id: string) => void;
  removePendingAttachmentId: (id: string) => void;
  clearPendingAttachments: () => void;
};

export const useAssistantStore = create<AssistantStore>((set) => ({
  activeConversationId: null,
  draft: "",
  pendingAttachmentIds: [],
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setDraft: (draft) => set({ draft }),
  addPendingAttachmentId: (id) =>
    set((state) => ({
      pendingAttachmentIds: state.pendingAttachmentIds.includes(id)
        ? state.pendingAttachmentIds
        : [...state.pendingAttachmentIds, id],
    })),
  removePendingAttachmentId: (id) =>
    set((state) => ({
      pendingAttachmentIds: state.pendingAttachmentIds.filter((item) => item !== id),
    })),
  clearPendingAttachments: () => set({ pendingAttachmentIds: [] }),
}));
