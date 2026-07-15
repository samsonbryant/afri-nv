"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CitationList } from "@/features/assistant/components/citation-list";
import type { AssistantMessage } from "@/features/assistant/types";
import { cn } from "@/lib/utils/cn";

type MessageListProps = {
  messages: AssistantMessage[];
  isLoading?: boolean;
};

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace("language-", "") || "code";

  async function copy() {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="border-border group relative my-3 overflow-hidden rounded-lg border bg-slate-950 text-slate-50">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-[11px] text-slate-300">
        <span>{language}</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={() => void copy()}
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="ml-auto h-20 w-1/2" />
        <Skeleton className="h-24 w-3/4" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-display text-lg font-semibold">How can I help today?</p>
        <p className="text-muted-foreground max-w-md text-sm">
          Ask about workflows, documents, or automations. Attach files or images for richer answers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6" role="log" aria-live="polite">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        return (
          <article
            key={message.id || `${index}-${message.role}`}
            className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[min(720px,92%)] rounded-2xl px-4 py-3 text-sm",
                isUser ? "bg-primary text-primary-foreground" : "border-border bg-card border",
              )}
            >
              {message.attachments?.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {message.attachments.map((attachment) =>
                    attachment.kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={attachment.id}
                        src={attachment.url}
                        alt={attachment.name}
                        className="border-border/40 max-h-48 rounded-lg border object-cover"
                      />
                    ) : (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        className="border-border/50 rounded-md border px-2 py-1 text-xs underline-offset-4 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {attachment.name}
                      </a>
                    ),
                  )}
                </div>
              ) : null}

              {isUser ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div className="markdown-body [&_a]:text-primary space-y-3 [&_a]:underline-offset-4 hover:[&_a]:underline [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      code({ className, children, ...props }) {
                        const text = String(children).replace(/\n$/, "");
                        const isBlock = Boolean(className) || text.includes("\n");
                        if (!isBlock) {
                          return (
                            <code className="bg-muted rounded px-1 py-0.5 text-[0.85em]" {...props}>
                              {children}
                            </code>
                          );
                        }
                        return <CodeBlock className={className}>{text}</CodeBlock>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.citations?.length ? (
                    <CitationList citations={message.citations} />
                  ) : null}
                </div>
              )}
            </div>
          </article>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
