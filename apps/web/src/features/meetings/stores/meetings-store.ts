"use client";

import { create } from "zustand";

type MeetingsStore = {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
};

export const useMeetingsStore = create<MeetingsStore>((set) => ({
  createOpen: false,
  setCreateOpen: (createOpen) => set({ createOpen }),
}));
