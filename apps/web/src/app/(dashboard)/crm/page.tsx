import type { Metadata } from "next";
import { CrmWorkspace } from "@/features/crm/components/crm-workspace";

export const metadata: Metadata = { title: "CRM" };

export default function CrmPage() {
  return <CrmWorkspace />;
}
