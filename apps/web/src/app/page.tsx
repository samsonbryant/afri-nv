import type { Metadata } from "next";
import { LandingPage } from "@/features/marketing/components/landing-page";

export const metadata: Metadata = {
  title: "Novixa — AI Client Management for Service Businesses",
  description:
    "Manage leads, create proposals, automate follow-ups, support customers, and track payments in one AI-powered workspace.",
};

export default function HomePage() {
  return <LandingPage />;
}
