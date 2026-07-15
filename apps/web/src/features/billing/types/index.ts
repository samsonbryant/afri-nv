export type BillingPlan = {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  currency?: string;
  features: string[];
  highlighted?: boolean;
  recommended?: boolean;
};

export type Subscription = {
  id: string;
  planId: string;
  planName: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "none";
  currentPeriodEnd: string;
  renewsAt?: string;
  seats: number;
  cancelAtPeriodEnd?: boolean;
};

export type Invoice = {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  issuedAt: string;
  pdfUrl?: string;
};

export type UsageMeter = {
  id: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
};

export type CheckoutInput = {
  planId: string;
  interval?: "month" | "year";
  coupon?: string;
};

export type CouponInput = {
  code: string;
};
