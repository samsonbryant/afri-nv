import type { Metadata } from "next";
import { BillingWorkspace } from "@/features/billing/components/billing-workspace";

export const metadata: Metadata = {
  title: "Billing",
};

export default function BillingPage() {
  return <BillingWorkspace />;
}
