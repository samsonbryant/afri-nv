import type { Metadata } from "next";
import { WorkflowsStudio } from "@/features/workflow-builder/components/workflows-studio";

export const metadata: Metadata = {
  title: "Workflows",
};

export default function WorkflowsPage() {
  return <WorkflowsStudio />;
}
