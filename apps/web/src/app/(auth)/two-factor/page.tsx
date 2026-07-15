import type { Metadata } from "next";
import { TwoFactorForm } from "@/features/auth/components/two-factor-form";

export const metadata: Metadata = {
  title: "Two-factor authentication",
  description: "Verify your identity to continue",
};

export default function TwoFactorPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Two-factor authentication
        </h1>
        <p className="text-muted-foreground text-sm">Enter the code from your authenticator app</p>
      </div>
      <TwoFactorForm />
    </div>
  );
}
