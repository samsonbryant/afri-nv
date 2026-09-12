import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="container max-w-3xl py-16 sm:py-24">
      <p className="text-primary text-sm font-semibold">Legal</p>
      <h1 className="font-display mt-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mt-3 text-sm">Effective September 12, 2026</p>
      <div className="mt-10 space-y-6 leading-7">
        <p>
          Novixa processes account, workspace, billing, support, and usage information to provide,
          secure, support, and improve the service. We only request information reasonably needed
          for those purposes.
        </p>
        <h2 className="font-display text-2xl font-semibold">Information and AI processing</h2>
        <p>
          Workspace content may be sent to configured AI and infrastructure providers when you use
          AI features. Do not submit secrets or highly sensitive personal information unless your
          organization has approved that use. We do not sell personal information.
        </p>
        <h2 className="font-display text-2xl font-semibold">Retention and security</h2>
        <p>
          We retain information while an account is active and as needed for security, legal, and
          financial obligations. We use access controls, encryption in transit, logging, and
          backups, but no online service can guarantee absolute security.
        </p>
        <h2 className="font-display text-2xl font-semibold">Your choices</h2>
        <p>
          You may request access, correction, export, or deletion of personal information, subject
          to applicable legal and operational requirements. Contact us using the support channel
          shown inside your Novixa account.
        </p>
      </div>
      <Link href="/" className="text-primary mt-10 inline-block font-medium hover:underline">
        Return home
      </Link>
    </main>
  );
}
