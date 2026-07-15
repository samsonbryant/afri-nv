import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Novixa password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
