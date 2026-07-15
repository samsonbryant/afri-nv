"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from "@/features/assistant/hooks/use-assistant";
import { useAssistantStore } from "@/features/assistant/stores/assistant-store";
import { cn } from "@/lib/utils/cn";
import { formatRelative } from "@/lib/utils/format";

type ConversationSidebarProps = {
  onSelect?: () => void;
};

export function ConversationSidebar({ onSelect }: ConversationSidebarProps) {
  const { data: conversations = [], isLoading } = useConversations();
  const create = useCreateConversation();
  const remove = useDeleteConversation();
  const activeConversationId = useAssistantStore((state) => state.activeConversationId);
  const setActiveConversationId = useAssistantStore((state) => state.setActiveConversationId);

  return (
    <aside
      className="border-border bg-muted/20 flex h-full w-full flex-col border-r md:w-72"
      aria-label="Conversations"
    >
      <div className="border-border flex items-center justify-between gap-2 border-b p-3">
        <h2 className="text-sm font-semibold">Chats</h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            create.mutate(undefined, { onSuccess: () => onSelect?.() });
          }}
          disabled={create.isPending}
        >
          <MessageSquarePlus className="h-4 w-4" aria-hidden />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            Start a conversation to see history here.
          </p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conversation, index) => {
              const active = conversation.id === activeConversationId;
              return (
                <li key={conversation.id || `conversation-${index}`} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      onSelect?.();
                    }}
                    className={cn(
                      "focus-visible:ring-ring w-full rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2",
                      active ? "bg-primary/10 text-foreground" : "hover:bg-accent/60",
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <p className="truncate text-sm font-medium">{conversation.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {conversation.preview ?? formatRelative(conversation.updatedAt)}
                    </p>
                  </button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1 h-7 w-7 opacity-0 focus:opacity-100 group-hover:opacity-100"
                    aria-label={`Delete ${conversation.title}`}
                    onClick={() => remove.mutate(conversation.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
