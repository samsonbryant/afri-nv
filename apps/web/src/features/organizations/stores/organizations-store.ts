"use client";

import { create } from "zustand";

type OrganizationsStore = {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
};

export const useOrganizationsStore = create<OrganizationsStore>((set) => ({
  activeOrganizationId: null,
  setActiveOrganizationId: (activeOrganizationId) => set({ activeOrganizationId }),
}));
