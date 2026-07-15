import { create } from "zustand";

type KnowledgeStore = {
  selectedDocumentId: string | null;
  activeConversationId: string | null;
  draft: string;
  setSelectedDocumentId: (id: string | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setDraft: (draft: string) => void;
};

export const useKnowledgeStore = create<KnowledgeStore>((set) => ({
  selectedDocumentId: null,
  activeConversationId: null,
  draft: "",
  setSelectedDocumentId: (selectedDocumentId) => set({ selectedDocumentId }),
  setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
  setDraft: (draft) => set({ draft }),
}));
