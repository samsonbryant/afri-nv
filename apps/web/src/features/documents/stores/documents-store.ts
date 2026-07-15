"use client";

import { create } from "zustand";
import type { DocumentJob } from "@/features/documents/types";

type DocumentsUiState = {
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
  activeJob: DocumentJob | null;
  setActiveJob: (job: DocumentJob | null) => void;
  compareDocumentId: string;
  setCompareDocumentId: (id: string) => void;
  translateLanguage: string;
  setTranslateLanguage: (lang: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

export const useDocumentsStore = create<DocumentsUiState>((set) => ({
  selectedDocumentId: null,
  setSelectedDocumentId: (selectedDocumentId) => set({ selectedDocumentId }),
  activeJob: null,
  setActiveJob: (activeJob) => set({ activeJob }),
  compareDocumentId: "",
  setCompareDocumentId: (compareDocumentId) => set({ compareDocumentId }),
  translateLanguage: "es",
  setTranslateLanguage: (translateLanguage) => set({ translateLanguage }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
