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

function formatLocalAmount(amountCents: number, currency: string) {
  const value = amountCents / 100;
  return `${currency.toUpperCase()} ${value.toLocaleString()}`;
}

export function BillingWorkspace() {
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: usage = [], isLoading: usageLoading } = useUsageMeters();
  const { data: instructions } = useManualPaymentInstructions();
  const { data: manualPayments = [] } = useManualPayments();
  const createPayment = useCreateManualPayment();

  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);
  const [provider, setProvider] = useState<MobileMoneyProvider>("mtn_momo");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerName, setPayerName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  const selectedProvider = useMemo(
    () => instructions?.providers.find((p) => p.id === provider),
    [instructions, provider],
  );

  const localAmountLabel = useMemo(() => {
    if (!selectedPlan || !instructions) return "";
    const local = Math.round(selectedPlan.priceMonthly * instructions.usdToLocalRate);
    return `${instructions.currency.toUpperCase()} ${local.toLocaleString()}`;
  }, [selectedPlan, instructions]);

  const openRequests = manualPayments.filter(
    (p) => p.status === "pending" || p.status === "submitted",
  );

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Pay with MTN Mobile Money or Orange Money. An admin activates your package after verifying the transfer."
      />

      <section className="border-border bg-card mb-8 rounded-xl border p-5">
        <div className="flex items-start gap-3">
          <Smartphone className="text-muted-foreground mt-0.5 h-5 w-5" />
          <div>
            <h2 className="font-display text-lg font-semibold">Mobile money (interim)</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Card checkout is waiting on processor approval. Use MTN MoMo or Orange Money now —
              include the payment reference in the transfer note, then submit your transaction ID
              for admin approval.
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
                Renews {formatDate(subscription.currentPeriodEnd, "PP")} · {subscription.seats}{" "}
                seats
                {subscription.cancelAtPeriodEnd ? " · Cancels at period end" : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-3 text-sm">No active subscription yet.</p>
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
              const local =
                instructions != null
                  ? Math.round(plan.priceMonthly * instructions.usdToLocalRate)
                  : null;
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
                  {local != null && plan.id !== "enterprise" ? (
                    <p className="text-muted-foreground text-sm">
                      ≈ {instructions?.currency.toUpperCase()} {local.toLocaleString()}
                    </p>
                  ) : null}
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
                    {current
                      ? "Current plan"
                      : plan.id === "enterprise"
                        ? "Contact sales"
                        : "Pay with MoMo"}
                  </Button>
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
                  <TableCell>{formatLocalAmount(row.amountCents, row.currency)}</TableCell>
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
              Send payment via mobile money, then submit your transaction details for admin
              approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground text-sm">
              Amount: <strong>{localAmountLabel}</strong> (≈ ${selectedPlan?.priceMonthly}/mo).
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
