"use client";

import { create } from "zustand";

type WorkflowsUiState = {
  search: string;
  setSearch: (search: string) => void;
};

export const useWorkflowsStore = create<WorkflowsUiState>((set) => ({
  search: "",
  setSearch: (search) => set({ search }),
}));
