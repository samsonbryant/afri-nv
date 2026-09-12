import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="container max-w-3xl py-16 sm:py-24">
      <p className="text-primary text-sm font-semibold">Legal</p>
      <h1 className="font-display mt-2 text-4xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground mt-3 text-sm">Effective September 12, 2026</p>
      <div className="mt-10 space-y-6 leading-7">
        <p>
          By creating an account or using Novixa, you agree to these terms and confirm that you can
          enter into this agreement for yourself or your organization.
        </p>
        <h2 className="font-display text-2xl font-semibold">Acceptable use</h2>
        <p>
          You must not use Novixa to violate law, infringe rights, distribute malware, deceive
          others, evade service limits, or interfere with the platform. You are responsible for your
          users, workspace content, connected services, and decisions made using AI output.
        </p>
        <h2 className="font-display text-2xl font-semibold">Subscriptions</h2>
        <p>
          Paid plans renew automatically at the displayed interval until cancelled. Trial limits,
          prices, taxes, currencies, and renewal dates are presented before checkout. Cancel before
          a trial ends to avoid the first charge.
        </p>
        <h2 className="font-display text-2xl font-semibold">AI output and availability</h2>
        <p>
          AI output can be inaccurate and must be reviewed before important use. The service is
          provided without a guarantee of uninterrupted availability. Features and limits may change
          with reasonable notice.
        </p>
        <h2 className="font-display text-2xl font-semibold">Liability</h2>
        <p>
          To the extent permitted by law, Novixa is not liable for indirect or consequential loss.
          Aggregate liability is limited to fees paid for the service during the preceding three
          months. Rights that cannot legally be limited remain unaffected.
        </p>
      </div>
      <Link href="/" className="text-primary mt-10 inline-block font-medium hover:underline">
        Return home
      </Link>
    </main>
  );
}
