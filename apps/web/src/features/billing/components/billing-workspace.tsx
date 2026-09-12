"use client";

import { useMemo, useState } from "react";
import { CreditCard, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  useAttachCard,
  useCheckout,
  useCreateManualPayment,
  useInvoices,
  useManualPaymentInstructions,
  useManualPayments,
  usePlans,
  useSubscription,
  useUsageMeters,
} from "@/features/billing/hooks/use-billing";
import type { BillingPlan, MobileMoneyProvider } from "@/features/billing/types";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { toast } from "sonner";

function formatMoney(amountCents: number) {
  const value = amountCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function BillingWorkspace() {
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: usage = [], isLoading: usageLoading } = useUsageMeters();
  const { data: instructions } = useManualPaymentInstructions();
  const { data: manualPayments = [] } = useManualPayments();
  const createPayment = useCreateManualPayment();
  const attachCard = useAttachCard();
  const checkout = useCheckout();

  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [provider, setProvider] = useState<MobileMoneyProvider>("mtn_momo");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerName, setPayerName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [cardRef, setCardRef] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardBrand, setCardBrand] = useState("visa");

  const selectedProvider = useMemo(
    () => instructions?.providers.find((p) => p.id === provider),
    [instructions, provider],
  );

  const usdAmountLabel = useMemo(() => {
    if (!selectedPlan) return "";
    return formatMoney(Math.round(selectedPlan.priceMonthly * 100));
  }, [selectedPlan]);

  const openRequests = manualPayments.filter(
    (p) => p.status === "pending" || p.status === "submitted",
  );

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Explore all core modules for 15 days with up to 100 AI requests. When the trial ends, we auto-debit your plan in USD. Mobile money is available in supported markets."
      />

      <section className="border-border bg-card mb-8 rounded-xl border p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="text-muted-foreground mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold">
              Card on file (required for trial)
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Add a payment method so Novixa can charge your selected plan automatically when the
              15-day trial ends.
            </p>
            {subscription?.cardLast4 ? (
              <p className="mt-3 text-sm">
                Saved: {(subscription.cardBrand || "card").toUpperCase()} ····{" "}
                {subscription.cardLast4}
                {subscription.autoCharge ? " · auto-charge on" : ""}
                {subscription.trialEnd
                  ? ` · trial ends ${formatDate(subscription.trialEnd, "PP")}`
                  : ""}
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="card-ref">Payment method reference</Label>
                  <Input
                    id="card-ref"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    placeholder="pm_… or processor token"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-last4">Last 4</Label>
                  <Input
                    id="card-last4"
                    value={cardLast4}
                    maxLength={4}
                    onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="4242"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="card-brand">Brand</Label>
                  <Input
                    id="card-brand"
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    placeholder="visa"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    disabled={!cardRef.trim() || attachCard.isPending}
                    onClick={() =>
                      attachCard.mutate({
                        paymentMethodRef: cardRef.trim(),
                        cardLast4: cardLast4.trim(),
                        cardBrand: cardBrand.trim(),
                      })
                    }
                  >
                    Save card for auto-debit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-border bg-card mb-8 rounded-xl border p-5">
        <div className="flex items-start gap-3">
          <Smartphone className="text-muted-foreground mt-0.5 h-5 w-5" />
          <div>
            <h2 className="font-display text-lg font-semibold">Mobile money (interim)</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Prefer MTN MoMo or Orange Money while card processors finish approval — send the exact
              USD plan amount and submit your transaction ID for admin activation.
            </p>
            {instructions?.steps?.length ? (
              <ol className="text-muted-foreground mt-3 list-decimal space-y-1 pl-5 text-sm">
                {instructions.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            ) : null}
          </div>
        </div>
      </section>

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
                {subscription.status === "trialing" && subscription.trialEnd
                  ? `Trial until ${formatDate(subscription.trialEnd, "PP")} · up to 100 AI requests · then auto-charge`
                  : `Renews ${formatDate(subscription.currentPeriodEnd, "PP")}`}
                {` · ${subscription.seats} seats`}
                {subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm">
            No active subscription yet. Choose a plan to start the 15-day trial.
          </p>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-display mb-4 text-lg font-semibold">Packages</h2>
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
                    {plan.id === "enterprise"
                      ? "Custom"
                      : formatMoney(Math.round(plan.priceMonthly * 100))}
                    {plan.id !== "enterprise" ? (
                      <span className="text-muted-foreground text-sm font-normal">/mo</span>
                    ) : null}
                  </p>
                  {plan.id !== "enterprise" ? (
                    <p className="text-muted-foreground text-sm">USD only</p>
                  ) : null}
                  <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="text-muted-foreground">
                        · {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-col gap-2">
                    <Button
                      variant={current ? "secondary" : "default"}
                      disabled={current || plan.id === "enterprise" || checkout.isPending}
                      onClick={() => {
                        if (plan.id === "enterprise") return;
                        checkout.mutate(
                          { planId: plan.id },
                          {
                            onSuccess: (result) => {
                              if (result.url) {
                                window.location.href = result.url;
                                return;
                              }
                              toast.success(
                                "15-day trial started — add a card below for auto-debit.",
                              );
                              setCardRef(`pm_trial_${plan.id}_${Date.now()}`);
                              setCardLast4("4242");
                              setCardBrand("visa");
                            },
                          },
                        );
                      }}
                    >
                      {current
                        ? "Current plan"
                        : plan.id === "enterprise"
                          ? "Contact sales"
                          : checkout.isPending
                            ? "Starting…"
                            : "Start with card (15-day trial)"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={current || plan.id === "enterprise"}
                      onClick={() => {
                        setSelectedPlan(plan);
                        setProvider("mtn_momo");
                        setPayerPhone("");
                        setPayerName("");
                        setTransactionId("");
                        setNotes("");
                      }}
                    >
                      Pay with MoMo instead
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="border-border bg-card mb-8 rounded-xl border p-5">
        <h2 className="font-display mb-4 text-lg font-semibold">Payment requests</h2>
        {openRequests.length === 0 && manualPayments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No mobile money payment requests yet. Choose a package above to start.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manualPayments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.reference}</TableCell>
                  <TableCell>{row.planName}</TableCell>
                  <TableCell>{row.provider === "mtn_momo" ? "MTN MoMo" : "Orange Money"}</TableCell>
                  <TableCell>{formatMoney(row.amountCents)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === "approved"
                          ? "success"
                          : row.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(row.createdAt, "PP")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <h2 className="font-display text-lg font-semibold">Invoices</h2>
          {invoicesLoading ? (
            <Skeleton className="mt-4 h-24 w-full" />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No invoices"
              description="Approved mobile money payments will appear here."
              className="py-8"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.slice(0, 5).map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.number}</TableCell>
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

      <Dialog open={Boolean(selectedPlan)} onOpenChange={(open) => !open && setSelectedPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay for {selectedPlan?.name}</DialogTitle>
            <DialogDescription>
              Send the USD amount via mobile money, then submit your transaction details for admin
              approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground text-sm">
              Amount due: <strong>{usdAmountLabel}</strong> USD.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={provider === "mtn_momo" ? "default" : "outline"}
                onClick={() => setProvider("mtn_momo")}
              >
                MTN MoMo
              </Button>
              <Button
                type="button"
                size="sm"
                variant={provider === "orange_money" ? "default" : "outline"}
                onClick={() => setProvider("orange_money")}
              >
                Orange Money
              </Button>
            </div>
            <div className="border-border bg-muted/40 rounded-lg border p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Merchant:</span>{" "}
                {selectedProvider?.accountName || "Novixa"}
              </p>
              <p>
                <span className="text-muted-foreground">Number:</span>{" "}
                {selectedProvider?.number || "Set MTN_MOMO_NUMBER / ORANGE_MONEY_NUMBER in Render"}
              </p>
              <p className="mt-2">
                <span className="text-muted-foreground">Use this as the transfer note:</span> your
                payment reference will be generated on submit.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payer-phone">Payer phone</Label>
                <Input
                  id="payer-phone"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="6XXXXXXXX"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="payer-name">Payer name</Label>
                <Input
                  id="payer-name"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="txn-id">Transaction ID</Label>
                <Input
                  id="txn-id"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="MoMo / Orange receipt ID"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedPlan(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !selectedPlan ||
                !payerPhone.trim() ||
                !transactionId.trim() ||
                createPayment.isPending
              }
              onClick={() => {
                if (!selectedPlan) return;
                createPayment.mutate(
                  {
                    planId: selectedPlan.id,
                    provider,
                    payerPhone: payerPhone.trim(),
                    payerName: payerName.trim(),
                    transactionId: transactionId.trim(),
                    notes: notes.trim(),
                  },
                  { onSuccess: () => setSelectedPlan(null) },
                );
              }}
            >
              Submit for approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
