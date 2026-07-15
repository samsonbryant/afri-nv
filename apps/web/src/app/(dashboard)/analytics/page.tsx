import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";

export const metadata: Metadata = {
  title: "Analytics",
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
