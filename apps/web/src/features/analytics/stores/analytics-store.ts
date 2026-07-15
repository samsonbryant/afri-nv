"use client";

import { create } from "zustand";

type AnalyticsStore = {
  period: "7d" | "30d" | "90d";
  setPeriod: (period: "7d" | "30d" | "90d") => void;
};

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  period: "30d",
  setPeriod: (period) => set({ period }),
}));
