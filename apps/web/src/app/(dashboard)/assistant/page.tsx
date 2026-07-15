import type { Metadata } from "next";
import { ChatShell } from "@/features/assistant/components/chat-shell";

export const metadata: Metadata = {
  title: "Assistant",
  description: "Chat with Novixa AI across your workspace knowledge",
};

export default function AssistantPage() {
  return <ChatShell />;
}
