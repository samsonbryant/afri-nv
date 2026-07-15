import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Novixa password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-muted-foreground text-sm">Enter a strong password for your account</p>
      </div>
      <ResetPasswordForm token={token} />
    </div>
  );
}
