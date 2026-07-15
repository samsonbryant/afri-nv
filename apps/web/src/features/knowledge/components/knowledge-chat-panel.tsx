"use client";

import { Loader2, MessageSquare, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import {
  useKnowledgeConversations,
  useKnowledgeMessages,
  useSendKnowledgeChat,
} from "@/features/knowledge/hooks/use-knowledge";
import { useKnowledgeStore } from "@/features/knowledge/stores/knowledge-store";
import { formatRelative } from "@/lib/utils/format";

export function KnowledgeChatPanel() {
  const activeConversationId = useKnowledgeStore((s) => s.activeConversationId);
  const setActiveConversationId = useKnowledgeStore((s) => s.setActiveConversationId);
  const draft = useKnowledgeStore((s) => s.draft);
  const setDraft = useKnowledgeStore((s) => s.setDraft);

  const conversations = useKnowledgeConversations();
  const messages = useKnowledgeMessages(activeConversationId);
  const send = useSendKnowledgeChat();

  function handleSend() {
    const content = draft.trim();
    if (!content || send.isPending) return;
    send.mutate({
      conversationId: activeConversationId,
      content,
    });
  }

  return (
    <div className="grid min-h-[420px] gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="border-border bg-card rounded-xl border p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium">Conversations</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveConversationId(null)}
          >
            New
          </Button>
        </div>
        {conversations.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}
        {!conversations.isLoading && (!conversations.data || conversations.data.length === 0) ? (
          <p className="text-muted-foreground px-1 text-xs">
            Ask a question to start chatting with your documents.
          </p>
        ) : null}
        <ul className="space-y-1">
          {conversations.data?.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                className={`focus-visible:ring-ring w-full rounded-md px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                  conversation.id === activeConversationId
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <span className="line-clamp-1 font-medium">{conversation.title}</span>
                <span className="text-muted-foreground mt-0.5 block text-[11px]">
                  {formatRelative(conversation.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="border-border bg-card flex min-h-[420px] flex-col rounded-xl border">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!activeConversationId && !messages.data?.length ? (
            <EmptyState
              icon={MessageSquare}
              title="Chat with your knowledge"
              description="Ask questions and get answers with citations from indexed documents."
              className="border-0 bg-transparent py-12"
            />
          ) : null}

          {messages.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              <Skeleton className="h-16 w-3/4" />
              <Skeleton className="ml-auto h-20 w-2/3" />
            </div>
          ) : null}

          {messages.data?.map((message) => (
            <div
              key={message.id}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground ml-auto"
                  : "bg-muted text-foreground"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              {message.citations && message.citations.length > 0 ? (
                <div className="border-border/50 mt-3 space-y-2 border-t pt-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                    Sources
                  </p>
                  {message.citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="bg-background/50 rounded-md px-2 py-1.5 text-xs"
                    >
                      <p className="font-medium">{citation.title}</p>
                      {citation.snippet ? (
                        <p className="mt-0.5 opacity-80">{citation.snippet}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="border-border border-t p-3">
          <div className="flex gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about your documents…"
              className="min-h-[72px] resize-none"
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              type="button"
              className="self-end"
              disabled={!draft.trim() || send.isPending}
              onClick={handleSend}
              aria-label="Send message"
            >
              {send.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-muted-foreground mt-2 text-[11px]">Press ⌘+Enter to send</p>
        </div>
      </div>
    </div>
  );
}
