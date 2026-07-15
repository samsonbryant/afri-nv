import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Novixa account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-muted-foreground text-sm">Start operating with Novixa in minutes</p>
      </div>
      <RegisterForm />
    </div>
  );
}
