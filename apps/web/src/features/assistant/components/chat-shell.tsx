"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MessageList } from "@/features/assistant/components/message-list";
import { MessageInput } from "@/features/assistant/components/message-input";
import { ConversationSidebar } from "@/features/assistant/components/conversation-sidebar";
import { useMessages } from "@/features/assistant/hooks/use-assistant";
import { useAssistantStore } from "@/features/assistant/stores/assistant-store";

export function ChatShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeConversationId = useAssistantStore((state) => state.activeConversationId);
  const { data: messages = [], isLoading } = useMessages(activeConversationId);

  return (
    <div className="border-border -mx-4 -mb-6 flex h-[calc(100vh-4rem)] min-h-[560px] overflow-hidden border-t md:-mx-6 md:-mb-8">
      <div className="hidden md:flex">
        <ConversationSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-border flex items-center gap-2 border-b px-3 py-2 md:hidden">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setMobileOpen(true)}
            aria-label="Open conversations"
          >
            <PanelLeft className="h-4 w-4" />
            Chats
          </Button>
          <p className="text-muted-foreground truncate text-sm">
            {activeConversationId ? "Conversation" : "New chat"}
          </p>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Conversations</SheetTitle>
              <SheetDescription>Browse and open assistant conversations.</SheetDescription>
            </SheetHeader>
            <ConversationSidebar onSelect={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <MessageList messages={messages} isLoading={Boolean(activeConversationId) && isLoading} />
        </div>

        <MessageInput />
      </div>
    </div>
  );
}
