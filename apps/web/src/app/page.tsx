import type { Metadata } from "next";
import { LandingPage } from "@/features/marketing/components/landing-page";

export const metadata: Metadata = {
  title: "Novixa — AI Business Operating System",
  description:
    "Orchestrate assistants, workflows, knowledge, CRM, and subscriptions in one AI platform.",
};

export default function HomePage() {
  return <LandingPage />;
}
