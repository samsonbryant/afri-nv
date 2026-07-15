"use client";

import { create } from "zustand";

type DashboardStore = {
  selectedRange: "7d" | "30d" | "90d";
  setSelectedRange: (range: "7d" | "30d" | "90d") => void;
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  selectedRange: "7d",
  setSelectedRange: (selectedRange) => set({ selectedRange }),
}));
