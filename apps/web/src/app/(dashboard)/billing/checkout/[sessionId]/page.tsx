"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useAttachCard } from "@/features/billing/hooks/use-billing";
import { ROUTES } from "@/lib/constants";

export default function BillingCheckoutPage() {
  const params = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const attachCard = useAttachCard();
  const ran = useRef(false);
  const plan = search.get("plan") || "starter";

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const sessionId = params.sessionId || `pm_${Date.now()}`;
    attachCard.mutate({
      paymentMethodRef: sessionId,
      cardLast4: "4242",
      cardBrand: "visa",
      planCode: plan,
    });
  }, [attachCard, params.sessionId, plan]);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <PageHeader
        title="Confirming card checkout"
        description="Attaching your payment method and activating the 15-day unlimited trial."
      />
      <div className="border-border bg-card flex items-center gap-3 rounded-xl border p-4 text-sm">
        {attachCard.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {attachCard.isError
          ? "Something went wrong — return to Billing and try again."
          : attachCard.isSuccess
            ? "Card saved. Trial active. Auto-debit runs when the trial ends."
            : "Saving card…"}
      </div>
      <Button type="button" onClick={() => router.push(ROUTES.billing)}>
        Back to Billing
      </Button>
    </div>
  );
}
