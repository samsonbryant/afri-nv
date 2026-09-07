"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ORG_STORAGE_KEY } from "@/lib/constants";

type OrganizationsStore = {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
};

export const useOrganizationsStore = create<OrganizationsStore>()(
  persist(
    (set) => ({
      activeOrganizationId: null,
      setActiveOrganizationId: (activeOrganizationId) => set({ activeOrganizationId }),
    }),
    { name: ORG_STORAGE_KEY },
  ),
);
