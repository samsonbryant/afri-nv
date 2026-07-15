"use client";

import { create } from "zustand";
import type { UserPreferences } from "@/features/settings/types";

type SettingsStore = {
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  preferences: {
    theme: "system",
    emailNotifications: true,
    weeklyDigest: false,
  },
  setPreferences: (preferences) =>
    set((state) => ({
      preferences: { ...state.preferences, ...preferences },
    })),
}));
