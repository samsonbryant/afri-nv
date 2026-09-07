"use client";

import { createContext, useContext } from "react";

export type GuideControls = {
  available: boolean;
  active: boolean;
  start: () => void;
  close: () => void;
};

export const GuideContext = createContext<GuideControls>({
  available: false,
  active: false,
  start: () => undefined,
  close: () => undefined,
});

export function useGuide(): GuideControls {
  return useContext(GuideContext);
}
