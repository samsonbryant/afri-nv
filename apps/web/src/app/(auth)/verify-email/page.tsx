import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your Novixa email address",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-muted-foreground text-sm">Confirming your address for Novixa</p>
      </div>
      <VerifyEmailPanel token={token} />
    </div>
  );
}
