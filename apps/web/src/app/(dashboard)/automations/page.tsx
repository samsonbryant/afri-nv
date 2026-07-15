import type { Metadata } from "next";
import { AutomationsList } from "@/features/automations/components/automations-list";

export const metadata: Metadata = {
  title: "Automations",
};

export default function AutomationsPage() {
  return <AutomationsList />;
}
