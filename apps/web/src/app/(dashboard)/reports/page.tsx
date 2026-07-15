import type { Metadata } from "next";
import { ReportsStudio } from "@/features/reports/components/reports-studio";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return <ReportsStudio />;
}
