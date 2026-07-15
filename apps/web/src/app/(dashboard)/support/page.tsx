import type { Metadata } from "next";
import { SupportInbox } from "@/features/support/components/support-inbox";

export const metadata: Metadata = {
  title: "Support",
  description: "Manage customer conversations across all connected channels.",
};

export default function SupportPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col px-4 pb-4 pt-6 sm:px-6">
      <SupportInbox />
    </div>
  );
}
