import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickNumber, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  BillingPlan,
  CheckoutInput,
  CouponInput,
  Invoice,
  Subscription,
  UsageMeter,
} from "@/features/billing/types";

const demoPlans: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For small teams getting started",
    priceMonthly: 49,
    currency: "USD",
    features: ["5 seats", "10k AI tokens/mo", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing operations teams",
    priceMonthly: 149,
    currency: "USD",
    features: ["20 seats", "100k AI tokens/mo", "Workflows & agents"],
    highlighted: true,
    recommended: true,
  },
  {
    id: "scale",
    name: "Scale",
    description: "Higher limits and priority support",
    priceMonthly: 299,
    currency: "USD",
    features: ["50 seats", "500k AI tokens/mo", "SSO"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom security and contracts",
    priceMonthly: 0,
    currency: "USD",
    features: ["Unlimited seats", "Custom limits", "Audit logs"],
  },
];

function mapPlanFeatures(raw: Record<string, unknown>): string[] {
  if (Array.isArray(raw.features)) return raw.features.map(String);
  if (raw.features && typeof raw.features === "object") {
    return Object.entries(raw.features as Record<string, unknown>).map(
      ([key, value]) => `${key}: ${String(value)}`,
    );
  }
  return [];
}

function mapPlan(raw: Record<string, unknown>): BillingPlan {
  const amountCents = pickNumber(raw, "amount_cents", "amountCents");
  const priceMonthly =
    amountCents > 0
      ? amountCents / 100
      : pickNumber(raw, "priceMonthly", "price_monthly", "amount");
  const code = pickString(raw, "code", "plan_code", "id") || "plan";
  return {
    id: code,
    name: pickString(raw, "name") || "Plan",
    description: pickString(raw, "description") || undefined,
    priceMonthly,
    currency: pickString(raw, "currency") || "USD",
    features: mapPlanFeatures(raw),
    highlighted: Boolean(raw.highlighted ?? raw.recommended),
    recommended: Boolean(raw.recommended ?? raw.highlighted),
  };
}

function mapSubscription(raw: Record<string, unknown>): Subscription {
  const periodEnd =
    pickString(raw, "currentPeriodEnd", "current_period_end", "renewsAt", "renews_at") ||
    new Date(Date.now() + 86400000 * 30).toISOString();
  return {
    id: String(raw.id ?? "sub"),
    planId: pickString(raw, "plan_code", "planCode", "planId", "plan_id") || "none",
    planName: pickString(raw, "planName", "plan_name", "plan_code", "name") || "None",
    status: (pickString(raw, "status") || "none") as Subscription["status"],
    currentPeriodEnd: periodEnd,
    renewsAt: periodEnd,
    seats: pickNumber(raw, "seats") || 1,
    cancelAtPeriodEnd: Boolean(raw.cancelAtPeriodEnd ?? raw.cancel_at_period_end),
  };
}

function mapInvoice(raw: Record<string, unknown>, index = 0): Invoice {
  const amountCents = pickNumber(raw, "amount_cents", "amountCents");
  return {
    id: String(raw.id ?? "").trim() || `invoice-${index}`,
    number: pickString(raw, "number", "invoice_number") || String(raw.id ?? index),
    amount: amountCents > 0 ? amountCents / 100 : pickNumber(raw, "amount", "total"),
    currency: pickString(raw, "currency") || "USD",
    status: (pickString(raw, "status") || "open") as Invoice["status"],
    issuedAt: pickIso(raw, "issuedAt", "issued_at", "created_at"),
    pdfUrl: pickString(raw, "pdfUrl", "pdf_url", "hosted_url") || undefined,
  };
}

function mapMeter(raw: Record<string, unknown>, index = 0): UsageMeter {
  const metric = pickString(raw, "metric", "label", "name") || `usage-${index}`;
  const quantity = pickNumber(raw, "quantity", "used", "current");
  return {
    id: String(raw.id ?? metric),
    label: metric,
    used: quantity,
    limit: pickNumber(raw, "limit", "max") || Math.max(quantity, 1),
    unit: pickString(raw, "unit") || "",
  };
}

export async function fetchSubscription(
  organizationId?: string | null,
): Promise<Subscription | null> {
  if (isDemoMode()) {
    return {
      id: "sub-demo",
      planId: "growth",
      planName: "Growth",
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 86400000 * 20).toISOString(),
      seats: 12,
      cancelAtPeriodEnd: false,
    };
  }
  try {
    const payload = await api.get<Record<string, unknown>>(
      withOrg(API_ENDPOINTS.billing.subscription, organizationId),
    );
    if (!payload || payload.subscription === null) return null;
    const raw =
      payload.subscription && typeof payload.subscription === "object"
        ? (payload.subscription as Record<string, unknown>)
        : payload;
    if (!raw.id && !raw.plan_code && !raw.plan_id) return null;
    return mapSubscription(raw);
  } catch {
    return null;
  }
}

export async function fetchPlans(organizationId?: string | null): Promise<BillingPlan[]> {
  if (isDemoMode()) return demoPlans;
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.billing.plans, organizationId));
    const list = unwrapList(payload).map(mapPlan);
    return list.length > 0 ? list : demoPlans;
  } catch {
    return demoPlans;
  }
}

export async function fetchInvoices(organizationId?: string | null): Promise<Invoice[]> {
  if (isDemoMode()) {
    const now = Date.now();
    return [
      {
        id: "inv-1",
        number: "INV-1001",
        amount: 149,
        currency: "USD",
        status: "paid",
        issuedAt: new Date(now - 86400000 * 30).toISOString(),
      },
      {
        id: "inv-2",
        number: "INV-1002",
        amount: 149,
        currency: "USD",
        status: "paid",
        issuedAt: new Date(now - 86400000 * 60).toISOString(),
      },
    ];
  }
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.billing.invoices, organizationId));
    return unwrapList(payload).map(mapInvoice);
  } catch {
    return [];
  }
}

export async function fetchUsage(organizationId?: string | null): Promise<UsageMeter[]> {
  if (isDemoMode()) {
    return [
      { id: "seats", label: "Seats", used: 12, limit: 20, unit: "seats" },
      {
        id: "tokens",
        label: "AI tokens",
        used: 42000,
        limit: 100000,
        unit: "tokens",
      },
      {
        id: "workflows",
        label: "Workflow runs",
        used: 180,
        limit: 500,
        unit: "runs",
      },
    ];
  }
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.billing.usage, organizationId));
    return unwrapList(payload).map(mapMeter);
  } catch {
    return [];
  }
}

export const fetchUsageMeters = fetchUsage;

export async function createCheckout(
  input: CheckoutInput,
  organizationId?: string | null,
): Promise<{ url?: string }> {
  if (isDemoMode()) {
    return { url: undefined };
  }
  if (!organizationId) {
    throw new Error("organization_id is required for checkout");
  }
  const payload = await api.post<Record<string, unknown>>(API_ENDPOINTS.billing.checkout, {
    plan_code: input.planId,
    organization_id: organizationId,
    ...(input.coupon ? { coupon: input.coupon } : {}),
  });
  return {
    url: pickString(payload, "url", "checkoutUrl", "checkout_url") || undefined,
  };
}

export async function applyCoupon(
  input: CouponInput,
  _organizationId?: string | null,
): Promise<{ applied: boolean; message: string }> {
  const code = input.code;
  if (isDemoMode()) {
    return {
      applied: code.trim().toUpperCase() === "NOVIXA20",
      message:
        code.trim().toUpperCase() === "NOVIXA20"
          ? "Coupon NOVIXA20 applied (20% off)"
          : "Invalid coupon code",
    };
  }
  const payload = await api.post<Record<string, unknown>>(API_ENDPOINTS.billing.coupon, { code });
  return {
    applied: Boolean(payload.applied ?? payload.valid),
    message:
      pickString(payload, "message", "detail") ||
      (payload.applied ? "Coupon applied" : "Coupon not applied"),
  };
}
