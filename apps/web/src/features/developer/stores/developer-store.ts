"use client";

import { create } from "zustand";

type DeveloperUiState = {
  keyDialogOpen: boolean;
  setKeyDialogOpen: (open: boolean) => void;
  webhookDialogOpen: boolean;
  setWebhookDialogOpen: (open: boolean) => void;
  lastCreatedSecret: string | null;
  setLastCreatedSecret: (secret: string | null) => void;
};

export const useDeveloperStore = create<DeveloperUiState>((set) => ({
  keyDialogOpen: false,
  setKeyDialogOpen: (keyDialogOpen) => set({ keyDialogOpen }),
  webhookDialogOpen: false,
  setWebhookDialogOpen: (webhookDialogOpen) => set({ webhookDialogOpen }),
  lastCreatedSecret: null,
  setLastCreatedSecret: (lastCreatedSecret) => set({ lastCreatedSecret }),
}));
