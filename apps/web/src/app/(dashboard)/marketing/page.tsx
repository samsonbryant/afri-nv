import type { Metadata } from "next";
import { MarketingStudio } from "@/features/marketing/components/marketing-studio";

export const metadata: Metadata = {
  title: "Marketing",
  description: "AI marketing content studio",
};

export default function MarketingPage() {
  return <MarketingStudio />;
}
