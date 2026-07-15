import type { Metadata } from "next";
import { KnowledgeWorkspace } from "@/features/knowledge/components/knowledge-workspace";

export const metadata: Metadata = {
  title: "Knowledge",
};

export default function KnowledgePage() {
  return <KnowledgeWorkspace />;
}
