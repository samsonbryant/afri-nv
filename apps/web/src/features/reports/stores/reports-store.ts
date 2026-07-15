"use client";

import { create } from "zustand";
import type { Report } from "@/features/reports/types";

type ReportsUiState = {
  selectedTemplateId: string | null;
  setSelectedTemplateId: (id: string | null) => void;
  activeReport: Report | null;
  setActiveReport: (report: Report | null) => void;
  generateDialogOpen: boolean;
  setGenerateDialogOpen: (open: boolean) => void;
};

export const useReportsStore = create<ReportsUiState>((set) => ({
  selectedTemplateId: null,
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  activeReport: null,
  setActiveReport: (report) => set({ activeReport: report }),
  generateDialogOpen: false,
  setGenerateDialogOpen: (open) => set({ generateDialogOpen: open }),
}));
