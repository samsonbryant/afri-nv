import type { Metadata } from "next";
import { WorkflowsList } from "@/features/workflows/components/workflows-list";

export const metadata: Metadata = {
  title: "Workflows",
};

export default function WorkflowsPage() {
  return <WorkflowsList />;
}
