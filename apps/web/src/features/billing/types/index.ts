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

export type MobileMoneyProvider = "mtn_momo" | "orange_money";

export type ManualPaymentInstructions = {
  currency: string;
  usdToLocalRate: number;
  providers: Array<{
    id: MobileMoneyProvider;
    name: string;
    number: string;
    accountName: string;
  }>;
  steps: string[];
};

export type ManualPaymentRequest = {
  id: string;
  organizationId: string;
  organizationName?: string;
  planCode: string;
  planName: string;
  provider: MobileMoneyProvider;
  status: "pending" | "submitted" | "approved" | "rejected" | "cancelled";
  amountCents: number;
  currency: string;
  reference: string;
  payerPhone: string;
  payerName?: string;
  transactionId: string;
  notes?: string;
  rejectionReason?: string;
  requestedByEmail?: string;
  createdAt: string;
};

export type CreateManualPaymentInput = {
  planId: string;
  provider: MobileMoneyProvider;
  payerPhone: string;
  payerName?: string;
  transactionId: string;
  notes?: string;
};
