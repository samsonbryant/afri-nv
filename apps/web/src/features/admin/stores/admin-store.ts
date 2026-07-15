"use client";

import { create } from "zustand";

type AdminTab =
  "users" | "organizations" | "subscriptions" | "payments" | "ai-usage" | "audit-logs" | "settings";

type AdminStore = {
  tab: AdminTab;
  setTab: (tab: AdminTab) => void;
  search: string;
  setSearch: (search: string) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  tab: "users",
  setTab: (tab) => set({ tab }),
  search: "",
  setSearch: (search) => set({ search }),
}));
