"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type GuideState = {
  completed: Record<string, number>;
  progress: Record<string, { version: number; step: number }>;
  setProgress: (key: string, version: number, step: number) => void;
  markCompleted: (key: string, version: number) => void;
  reset: (key: string) => void;
};

export const useGuideStore = create<GuideState>()(
  persist(
    (set) => ({
      completed: {},
      progress: {},
      setProgress: (key, version, step) =>
        set((state) => ({
          progress: { ...state.progress, [key]: { version, step } },
        })),
      markCompleted: (key, version) =>
        set((state) => {
          const progress = { ...state.progress };
          delete progress[key];
          return { completed: { ...state.completed, [key]: version }, progress };
        }),
      reset: (key) =>
        set((state) => {
          const completed = { ...state.completed };
          const progress = { ...state.progress };
          delete completed[key];
          delete progress[key];
          return { completed, progress };
        }),
    }),
    { name: "novixa-guides-v1" },
  ),
);
