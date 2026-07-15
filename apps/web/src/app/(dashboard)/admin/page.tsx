import type { Metadata } from "next";
import { AdminWorkspace } from "@/features/admin/components/admin-workspace";

export const metadata: Metadata = {
  title: "Admin",
};

export default function AdminPage() {
  return <AdminWorkspace />;
}
