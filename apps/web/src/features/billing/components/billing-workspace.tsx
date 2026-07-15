"use client";

import { CreditCard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useApplyCoupon,
  useCheckout,
  useInvoices,
  usePlans,
  useSubscription,
  useUsageMeters,
} from "@/features/billing/hooks/use-billing";
import { useBillingStore } from "@/features/billing/stores/billing-store";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

export function BillingWorkspace() {
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: usage = [], isLoading: usageLoading } = useUsageMeters();
  const checkout = useCheckout();
  const applyCoupon = useApplyCoupon();
  const { couponCode, setCouponCode } = useBillingStore();

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your subscription, usage, invoices, and coupons."
      />

      <section className="border-border bg-card mb-8 rounded-xl border p-5">
        <h2 className="font-display text-lg font-semibold">Current plan</h2>
        {subLoading ? (
          <Skeleton className="mt-4 h-16 w-full" />
        ) : subscription ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold">{subscription.planName}</p>
                <Badge variant="success">{subscription.status}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Renews {formatDate(subscription.currentPeriodEnd, "PP")} · {subscription.seats}{" "}
                seats
                {subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm">No active subscription.</p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-display mb-4 text-lg font-semibold">Plans</h2>
        {plansLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-busy>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const current = subscription?.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "border-border bg-card flex flex-col rounded-xl border p-5",
                    plan.highlighted && "border-primary",
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-semibold">{plan.name}</h3>
                    {plan.highlighted ? <Badge>Popular</Badge> : null}
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">
                    {plan.id === "enterprise" ? "Custom" : `$${plan.priceMonthly}`}
                    {plan.id !== "enterprise" ? (
                      <span className="text-muted-foreground text-sm font-normal">/mo</span>
                    ) : null}
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="text-muted-foreground">
                        · {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-5"
                    variant={current ? "secondary" : "default"}
                    disabled={current || checkout.isPending}
                    onClick={() => checkout.mutate({ planId: plan.id, interval: "month" })}
                  >
                    {current
                      ? "Current plan"
                      : plan.id === "enterprise"
                        ? "Contact sales"
                        : "Checkout"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="border-border bg-card rounded-xl border p-5">
          <h2 className="font-display text-lg font-semibold">Usage</h2>
          {usageLoading ? (
            <div className="mt-4 space-y-3" aria-busy>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : usage.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">No usage data.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {usage.map((meter) => {
                const pct = Math.min(
                  100,
                  Math.round((meter.used / Math.max(meter.limit, 1)) * 100),
                );
                return (
                  <li key={meter.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{meter.label}</span>
                      <span className="text-muted-foreground">
                        {meter.used.toLocaleString()} / {meter.limit.toLocaleString()} {meter.unit}
                      </span>
                    </div>
                    <div className="bg-muted h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="border-border bg-card rounded-xl border p-5">
          <h2 className="font-display text-lg font-semibold">Coupon</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Apply a promotional code to your subscription.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="SAVE20"
            />
            <Button
              disabled={!couponCode.trim() || applyCoupon.isPending}
              onClick={() =>
                applyCoupon.mutate(
                  { code: couponCode.trim() },
                  { onSuccess: () => setCouponCode("") },
                )
              }
            >
              Apply
            </Button>
          </div>
        </section>
      </div>

      <section className="border-border bg-card rounded-xl border p-5">
        <h2 className="font-display mb-4 text-lg font-semibold">Invoices</h2>
        {invoicesLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No invoices"
            description="Invoices will appear here after your first payment."
            className="py-10"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{formatDate(invoice.issuedAt, "PP")}</TableCell>
                  <TableCell>
                    {invoice.currency} {invoice.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "paid" ? "success" : "secondary"}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
