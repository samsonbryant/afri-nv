"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAttachCard } from "@/features/billing/hooks/use-billing";
import { fetchBootstrapState } from "@/features/organizations/api/organizations-api";
import { ROUTES } from "@/lib/constants";

export default function BillingCheckoutPage() {
  const params = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const attachCard = useAttachCard();
  const ran = useRef(false);
  const [liveError, setLiveError] = useState(false);
  const plan = search.get("plan") || "starter";
  const isLiveReturn = params.sessionId === "dodo";

  useEffect(() => {
    if (isLiveReturn) return;
    if (ran.current) return;
    ran.current = true;
    const sessionId = params.sessionId || `pm_${Date.now()}`;
    attachCard.mutate({
      paymentMethodRef: sessionId,
      cardLast4: "4242",
      cardBrand: "visa",
      planCode: plan,
    });
  }, [attachCard, isLiveReturn, params.sessionId, plan]);

  useEffect(() => {
    if (!isLiveReturn) return;
    const organizationId = search.get("org");
    if (!organizationId) {
      setLiveError(true);
      return;
    }
    let attempts = 0;
    let cancelled = false;
    const check = async () => {
      attempts += 1;
      try {
        const state = await fetchBootstrapState(organizationId);
        if (cancelled) return;
        if (state.paymentMethodReady && state.entitlementActive) {
          router.replace(
            state.profileComplete ? ROUTES.dashboard : `${ROUTES.onboarding}?step=profile`,
          );
          return;
        }
      } catch {
        // Webhook processing can briefly lag behind the checkout redirect.
      }
      if (attempts >= 20 && !cancelled) {
        setLiveError(true);
        return;
      }
      if (!cancelled) window.setTimeout(check, 1500);
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, [isLiveReturn, router, search]);

  useEffect(() => {
    if (!attachCard.isSuccess) return;
    const timer = window.setTimeout(() => router.replace(`${ROUTES.onboarding}?step=profile`), 900);
    return () => window.clearTimeout(timer);
  }, [attachCard.isSuccess, router]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <PageHeader
        title="Confirming card checkout"
        description="Attaching your payment method and activating the 14-day trial."
      />
      <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4 text-sm">
        {attachCard.isPending || (isLiveReturn && !liveError) ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : null}
        {liveError
          ? "Payment confirmation is delayed. Return to Billing or refresh this page shortly."
          : isLiveReturn
            ? "Payment received. Waiting for secure provider confirmation…"
            : attachCard.isError
              ? "Something went wrong — return to Billing and try again."
              : attachCard.isSuccess
                ? "Card saved. Trial active. Auto-debit runs when the trial ends."
                : "Saving card…"}
      </div>
      <Button
        type="button"
        onClick={() =>
          router.push(attachCard.isSuccess ? `${ROUTES.onboarding}?step=profile` : ROUTES.billing)
        }
      >
        {attachCard.isSuccess ? "Continue business setup" : "Back to Billing"}
      </Button>
    </div>
  );
}
