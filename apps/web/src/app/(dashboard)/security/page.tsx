import type { Metadata } from "next";
import { SecurityPanel } from "@/features/security/components/security-panel";

export const metadata: Metadata = {
  title: "Security",
};

export default function SecurityPage() {
  return <SecurityPanel />;
}
