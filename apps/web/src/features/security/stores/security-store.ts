"use client";

import { create } from "zustand";

type SecurityStore = {
  // reserved for future filters
  _unused?: never;
};

export const useSecurityStore = create<SecurityStore>(() => ({}));
