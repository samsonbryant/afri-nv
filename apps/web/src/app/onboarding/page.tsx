"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, CreditCard, Loader2, Smartphone, Upload } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import {
  useCheckout,
  useCreateManualPayment,
  useManualPaymentInstructions,
  useManualPayments,
  usePlans,
} from "@/features/billing/hooks/use-billing";
import type { BillingPlan, MobileMoneyProvider } from "@/features/billing/types";
import {
  completeOnboardingRequest,
  fetchBootstrapState,
  updateOrganizationRequest,
} from "@/features/organizations/api/organizations-api";
import { organizationKeys } from "@/features/organizations/hooks/use-organizations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getErrorMessage } from "@/lib/api/errors";
import { ROUTES } from "@/lib/constants";

type Step = "trial" | "profile";

function OnboardingFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const search = useSearchParams();
  const organization = useAuthStore((state) => state.organization);
  const setOrganization = useAuthStore((state) => state.setOrganization);
  const { data: plans = [], isLoading: plansLoading } = usePlans();
  const checkout = useCheckout();
  const { data: instructions } = useManualPaymentInstructions();
  const { data: manualPayments = [] } = useManualPayments(true);
  const createManualPayment = useCreateManualPayment();
  const [mobilePlan, setMobilePlan] = useState<BillingPlan | null>(null);
  const [provider, setProvider] = useState<MobileMoneyProvider>("mtn_momo");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerName, setPayerName] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [step, setStep] = useState<Step>(search.get("step") === "profile" ? "profile" : "trial");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(organization?.logoUrl ?? null);
  const [form, setForm] = useState({
    name: organization?.name ?? "",
    industry: organization?.industry ?? "",
    website: organization?.website ?? "",
    phone: organization?.phone ?? "",
    address: organization?.address ?? "",
    description: organization?.description ?? "",
    productsServices: String(organization?.businessContext?.products_services ?? ""),
    targetCustomers: String(organization?.businessContext?.target_customers ?? ""),
    brandVoice: String(organization?.businessContext?.brand_voice ?? ""),
    goals: String(organization?.businessContext?.goals ?? ""),
    automationPriorities: String(organization?.businessContext?.automation_priorities ?? ""),
  });

  useEffect(() => {
    if (!organization?.id) return;
    let active = true;
    fetchBootstrapState(organization.id)
      .then((state) => {
        if (!active) return;
        if (state.organization) setOrganization(state.organization);
        if (state.nextStep === "dashboard") {
          router.replace(ROUTES.dashboard);
        } else {
          setStep(state.nextStep === "profile" ? "profile" : "trial");
        }
      })
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [organization?.id, router, setOrganization]);

  useEffect(() => {
    if (!logo) return;
    const url = URL.createObjectURL(logo);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const availablePlans = useMemo(() => plans.filter((plan) => plan.id !== "enterprise"), [plans]);
  const selectedProvider = useMemo(
    () => instructions?.providers.find((item) => item.id === provider),
    [instructions, provider],
  );
  const pendingPayment = manualPayments.find(
    (payment) => payment.status === "pending" || payment.status === "submitted",
  );

  useEffect(() => {
    if (step !== "trial" || !manualPayments.some((payment) => payment.status === "approved")) {
      return;
    }
    toast.success("Payment approved — continue setting up your business");
    setStep("profile");
  }, [manualPayments, step]);

  function openMobilePayment(plan: BillingPlan) {
    setMobilePlan(plan);
    setProvider("mtn_momo");
    setPayerPhone("");
    setPayerName("");
    setTransactionId("");
  }

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile() {
    if (!organization?.id) return;
    if (!form.name.trim() || !form.industry.trim() || !form.description.trim()) {
      toast.error("Organization name, industry, and business description are required.");
      return;
    }
    if (!logo && !organization.logoUrl) {
      toast.error("Upload your organization logo before continuing.");
      return;
    }
    setSaving(true);
    try {
      let updated = await updateOrganizationRequest(organization.id, {
        name: form.name.trim(),
        industry: form.industry.trim(),
        website: form.website.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        description: form.description.trim(),
        business_context: {
          summary: form.description.trim(),
          industry: form.industry.trim(),
          website: form.website.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          products_services: form.productsServices.trim(),
          target_customers: form.targetCustomers.trim(),
          brand_voice: form.brandVoice.trim(),
          goals: form.goals.trim(),
          automation_priorities: form.automationPriorities.trim(),
        },
      });
      if (logo) {
        const body = new FormData();
        body.append("logo", logo);
        updated = await updateOrganizationRequest(organization.id, body);
      }
      updated = await completeOnboardingRequest(organization.id);
      setOrganization(updated);
      await queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      toast.success("Your workspace is ready");
      router.replace(ROUTES.dashboard);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (checking || !organization) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="text-primary h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="text-center">
        <p className="text-primary text-sm font-medium">Workspace setup</p>
        <h1 className="font-display mt-2 text-3xl font-semibold">
          Set Novixa up for your business
        </h1>
        <p className="text-muted-foreground mt-2">
          Start your trial, then give the AI the context it needs to automate your work.
        </p>
      </div>

      <ol className="mx-auto flex max-w-lg items-center gap-3">
        {(["trial", "profile"] as const).map((item, index) => (
          <li key={item} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                step === item ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {step === "profile" && item === "trial" ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="text-sm font-medium">
              {item === "trial" ? "14-day trial" : "Business profile"}
            </span>
          </li>
        ))}
      </ol>

      {step === "trial" ? (
        <section className="border-border bg-card rounded-2xl border p-6">
          <div className="mb-5 flex items-start gap-3">
            <CreditCard className="text-primary mt-1 h-5 w-5" />
            <div>
              <h2 className="font-display text-xl font-semibold">Choose your plan</h2>
              <p className="text-muted-foreground text-sm">
                Pay by card, MTN MoMo, or Orange Money. Mobile-money access starts after an admin
                verifies the transfer.
              </p>
            </div>
          </div>
          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-5 ${
                    plan.recommended ? "border-primary ring-primary/20 ring-2" : "border-border"
                  }`}
                >
                  <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-2 text-2xl font-bold">
                    ${plan.priceMonthly}
                    <span className="text-muted-foreground text-sm font-normal">/month</span>
                  </p>
                  <p className="text-muted-foreground mt-2 min-h-10 text-sm">{plan.description}</p>
                  <ul className="text-muted-foreground my-4 space-y-1 text-sm">
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature}>• {feature}</li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      disabled={checkout.isPending}
                      onClick={() =>
                        checkout.mutate(
                          { planId: plan.id },
                          { onError: () => openMobilePayment(plan) },
                        )
                      }
                    >
                      {checkout.isPending ? "Opening checkout…" : "Pay with card"}
                    </Button>
                    <Button
                      className="w-full"
                      type="button"
                      variant="outline"
                      onClick={() => openMobilePayment(plan)}
                    >
                      <Smartphone className="mr-2 h-4 w-4" />
                      Pay with mobile money
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pendingPayment ? (
            <div className="border-border bg-muted/40 mt-5 rounded-xl border p-4 text-sm">
              <p className="font-medium">Payment submitted — awaiting admin approval</p>
              <p className="text-muted-foreground mt-1">
                Reference {pendingPayment.reference}. This page checks automatically every 5 seconds
                and will continue when your payment is approved.
              </p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="border-border bg-card rounded-2xl border p-6">
          <div className="mb-5 flex items-start gap-3">
            <Building2 className="text-primary mt-1 h-5 w-5" />
            <div>
              <h2 className="font-display text-xl font-semibold">
                Tell the AI about your business
              </h2>
              <p className="text-muted-foreground text-sm">
                This shared profile personalizes agents, workflows, marketing, support, reports, and
                document automation.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Organization name" required>
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </Field>
            <Field label="Industry" required>
              <Input
                value={form.industry}
                onChange={(event) => updateField("industry", event.target.value)}
                placeholder="Retail, healthcare, logistics…"
              />
            </Field>
            <Field label="Website">
              <Input
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </Field>
            <Field label="Address">
              <Input
                value={form.address}
                onChange={(event) => updateField("address", event.target.value)}
              />
            </Field>
            <Field label="Products or services">
              <Input
                value={form.productsServices}
                onChange={(event) => updateField("productsServices", event.target.value)}
              />
            </Field>
            <Field label="Target customers">
              <Input
                value={form.targetCustomers}
                onChange={(event) => updateField("targetCustomers", event.target.value)}
              />
            </Field>
            <Field label="Brand voice">
              <Input
                value={form.brandVoice}
                onChange={(event) => updateField("brandVoice", event.target.value)}
                placeholder="Professional, friendly, direct…"
              />
            </Field>
            <Field label="Business goals">
              <Input
                value={form.goals}
                onChange={(event) => updateField("goals", event.target.value)}
              />
            </Field>
            <Field label="Automation priorities">
              <Input
                value={form.automationPriorities}
                onChange={(event) => updateField("automationPriorities", event.target.value)}
                placeholder="Lead follow-up, reporting, support…"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="About the business" required>
                <textarea
                  className="border-input bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm"
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="What you do, how you operate, and what makes the business different"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Label>Organization logo *</Label>
              <div className="border-border mt-2 flex items-center gap-4 rounded-xl border p-4">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Organization logo preview"
                    className="h-16 w-16 rounded-lg object-contain"
                  />
                ) : (
                  <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-lg">
                    <Building2 className="text-muted-foreground h-6 w-6" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <span className="border-input hover:bg-accent inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium">
                    <Upload className="h-4 w-4" />
                    Choose logo
                  </span>
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
                  />
                </label>
                <span className="text-muted-foreground text-xs">PNG, JPG, or WebP; max 5 MB</span>
              </div>
            </div>
          </div>
          <Button className="mt-6 w-full" disabled={saving} onClick={() => void saveProfile()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Finish setup and open dashboard
          </Button>
        </section>
      )}

      <Dialog open={Boolean(mobilePlan)} onOpenChange={(open) => !open && setMobilePlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay for {mobilePlan?.name}</DialogTitle>
            <DialogDescription>
              Send the exact amount, then submit the mobile-money transaction ID for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm">
              Amount due: <strong>${mobilePlan?.priceMonthly.toFixed(2)} USD</strong>
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
              <p>Merchant: {selectedProvider?.accountName || "Novixa"}</p>
              <p>Number: {selectedProvider?.number || "Not configured"}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-phone">Payer phone number</Label>
              <Input
                id="mobile-phone"
                value={payerPhone}
                onChange={(event) => setPayerPhone(event.target.value)}
                placeholder="Your MTN or Orange number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-name">Payer name</Label>
              <Input
                id="mobile-name"
                value={payerName}
                onChange={(event) => setPayerName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile-transaction">Transaction ID</Label>
              <Input
                id="mobile-transaction"
                value={transactionId}
                onChange={(event) => setTransactionId(event.target.value)}
                placeholder="Receipt or transaction ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setMobilePlan(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                !mobilePlan ||
                !selectedProvider?.number ||
                !payerPhone.trim() ||
                !transactionId.trim() ||
                createManualPayment.isPending
              }
              onClick={() => {
                if (!mobilePlan) return;
                createManualPayment.mutate(
                  {
                    planId: mobilePlan.id,
                    provider,
                    payerPhone: payerPhone.trim(),
                    payerName: payerName.trim(),
                    transactionId: transactionId.trim(),
                  },
                  { onSuccess: () => setMobilePlan(null) },
                );
              }}
            >
              {createManualPayment.isPending ? "Submitting…" : "Submit for approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <div className="bg-background min-h-screen px-4 py-10">
        <OnboardingFlow />
      </div>
    </AuthGuard>
  );
}
