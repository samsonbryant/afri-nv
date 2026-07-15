"use client";

import { create } from "zustand";

type AutomationsStore = {
  showDisabled: boolean;
  setShowDisabled: (show: boolean) => void;
};

export const useAutomationsStore = create<AutomationsStore>((set) => ({
  showDisabled: true,
  setShowDisabled: (showDisabled) => set({ showDisabled }),
}));
