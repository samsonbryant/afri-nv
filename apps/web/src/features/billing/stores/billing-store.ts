"use client";

import { create } from "zustand";

type BillingStore = {
  couponCode: string;
  setCouponCode: (code: string) => void;
};

export const useBillingStore = create<BillingStore>((set) => ({
  couponCode: "",
  setCouponCode: (couponCode) => set({ couponCode }),
}));
