import type { Metadata } from "next";
import { AboutPage } from "@/features/marketing/components/about-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Novixa and Founder & CEO Samson Bryant — Developer & TechPreneur building AI systems for business.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
