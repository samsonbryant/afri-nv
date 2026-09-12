import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Refund and Cancellation Policy" };

export default function RefundPolicyPage() {
  return (
    <main className="container max-w-3xl py-16 sm:py-24">
      <p className="text-primary text-sm font-semibold">Legal</p>
      <h1 className="font-display mt-2 text-4xl font-bold">Refund and Cancellation Policy</h1>
      <p className="text-muted-foreground mt-3 text-sm">Effective September 12, 2026</p>
      <div className="mt-10 space-y-6 leading-7">
        <h2 className="font-display text-2xl font-semibold">Trials and cancellation</h2>
        <p>
          You may cancel during the trial to prevent the first subscription charge. Paid plans can
          be cancelled before the next renewal and remain available through the paid period unless
          stated otherwise at checkout.
        </p>
        <h2 className="font-display text-2xl font-semibold">Refund requests</h2>
        <p>
          If you believe a charge was made in error, contact support within seven days with the
          account email and transaction reference. We review requests individually. Approved refunds
          return to the original payment method where supported.
        </p>
        <h2 className="font-display text-2xl font-semibold">Non-refundable items</h2>
        <p>
          Consumed usage, completed billing periods, custom services, and charges caused by failure
          to cancel before a clearly disclosed renewal are generally non-refundable, except where
          applicable law requires otherwise.
        </p>
      </div>
      <Link href="/" className="text-primary mt-10 inline-block font-medium hover:underline">
        Return home
      </Link>
    </main>
  );
}
