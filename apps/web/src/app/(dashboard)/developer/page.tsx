import type { Metadata } from "next";
import { DeveloperConsole } from "@/features/developer/components/developer-console";

export const metadata: Metadata = {
  title: "Developer",
};

export default function DeveloperPage() {
  return <DeveloperConsole />;
}
