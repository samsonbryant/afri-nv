"use client";

import { create } from "zustand";

export type CrmTab = "pipeline" | "companies" | "contacts" | "leads" | "activities";

type CrmUiState = {
  activeTab: CrmTab;
  setActiveTab: (tab: CrmTab) => void;

  selectedOpportunityId: string | null;
  setSelectedOpportunityId: (id: string | null) => void;

  companySearch: string;
  setCompanySearch: (search: string) => void;

  contactSearch: string;
  setContactSearch: (search: string) => void;

  leadSearch: string;
  setLeadSearch: (search: string) => void;
};

export const useCrmStore = create<CrmUiState>((set) => ({
  activeTab: "pipeline",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedOpportunityId: null,
  setSelectedOpportunityId: (id) => set({ selectedOpportunityId: id }),

  companySearch: "",
  setCompanySearch: (search) => set({ companySearch: search }),

  contactSearch: "",
  setContactSearch: (search) => set({ contactSearch: search }),

  leadSearch: "",
  setLeadSearch: (search) => set({ leadSearch: search }),
}));
