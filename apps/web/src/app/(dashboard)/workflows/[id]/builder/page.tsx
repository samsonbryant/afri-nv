import type { Metadata } from "next";
import { WorkflowBuilderPageClient } from "@/features/workflow-builder/components/workflow-builder-page-client";

export const metadata: Metadata = {
  title: "Workflow Builder",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkflowBuilderPage({ params }: PageProps) {
  const { id } = await params;
  return <WorkflowBuilderPageClient workflowId={id} />;
}
