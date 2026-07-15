"use client";

import { create } from "zustand";

type AgentsStore = {
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  prompt: string;
  setPrompt: (prompt: string) => void;
};

export const useAgentsStore = create<AgentsStore>((set) => ({
  selectedAgentId: null,
  setSelectedAgentId: (selectedAgentId) => set({ selectedAgentId }),
  prompt: "",
  setPrompt: (prompt) => set({ prompt }),
}));
