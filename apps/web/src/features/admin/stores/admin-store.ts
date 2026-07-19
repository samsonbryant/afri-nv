"use client";

import { create } from "zustand";
import type { AdminTab } from "@/features/admin/types";

type AdminStore = {
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
  search: string;
  setSearch: (search: string) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  tab: "overview",
  setTab: (tab) => set({ tab }),
  search: "",
  setSearch: (search) => set({ search }),
}));
