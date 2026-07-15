import type { Metadata } from "next";
import { DocumentsStudio } from "@/features/documents/components/documents-studio";

export const metadata: Metadata = {
  title: "Documents Studio",
};

export default function DocumentsPage() {
  return <DocumentsStudio />;
}
