import { create } from "zustand";
import type { MarketingAssetType, MarketingTone } from "@/features/marketing/types";

type MarketingStore = {
  type: MarketingAssetType;
  prompt: string;
  tone: MarketingTone;
  setType: (type: MarketingAssetType) => void;
  setPrompt: (prompt: string) => void;
  setTone: (tone: MarketingTone) => void;
};

export const useMarketingStore = create<MarketingStore>((set) => ({
  type: "linkedin",
  prompt: "",
  tone: "professional",
  setType: (type) => set({ type }),
  setPrompt: (prompt) => set({ prompt }),
  setTone: (tone) => set({ tone }),
}));
