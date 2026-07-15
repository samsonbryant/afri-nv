"use client";

import {
  Mail,
  MessageCircle,
  Hash,
  Smartphone,
  Globe,
  MessageSquare,
  Headphones,
  Sparkles,
  Send,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSupportStore } from "@/features/support/stores/support-store";
import {
  useSupportChannels,
  useSupportTickets,
  useSupportMessages,
  useSupportStats,
  useReplyToTicket,
  useAiReply,
} from "@/features/support/hooks/use-support";
import type {
  SupportChannel,
  SupportTicket,
  SupportMessage,
  ChannelType,
  TicketStatus,
  TicketPriority,
} from "@/features/support/types";
import React from "react";

// ---------------------------------------------------------------------------
// Channel icon map
// ---------------------------------------------------------------------------

const CHANNEL_ICONS: Record<ChannelType, LucideIcon> = {
  whatsapp: Smartphone,
  messenger: MessageCircle,
  email: Mail,
  slack: Hash,
  webchat: Globe,
  sms: MessageSquare,
};

function ChannelIcon({ type, className }: { type: ChannelType; className?: string }) {
  const Icon = CHANNEL_ICONS[type] ?? MessageSquare;
  return <Icon className={cn("h-4 w-4", className)} aria-hidden />;
}

// ---------------------------------------------------------------------------
// Status / priority helpers
// ---------------------------------------------------------------------------

const STATUS_VARIANTS: Record<TicketStatus, "success" | "warning" | "secondary" | "outline"> = {
  open: "success",
  pending: "warning",
  resolved: "secondary",
  closed: "outline",
};

const PRIORITY_VARIANTS: Record<
  TicketPriority,
  "destructive" | "warning" | "secondary" | "outline"
> = {
  urgent: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
};

function ticketStatusLabel(status: TicketStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function priorityLabel(priority: TicketPriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ---------------------------------------------------------------------------
// Stats strip
// ---------------------------------------------------------------------------

function StatsStrip() {
  const { data, isLoading } = useSupportStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Open", value: data?.open ?? 0, color: "text-teal-600 dark:text-teal-400" },
    { label: "Pending", value: data?.pending ?? 0, color: "text-amber-600 dark:text-amber-400" },
    { label: "Resolved", value: data?.resolved ?? 0, color: "text-slate-600 dark:text-slate-400" },
    { label: "Total", value: data?.total ?? 0, color: "text-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, color }) => (
        <Card key={label} className="flex flex-col items-center justify-center py-4">
          <span className={cn("text-2xl font-bold", color)}>{value}</span>
          <span className="text-muted-foreground mt-0.5 text-xs">{label}</span>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Channel list
// ---------------------------------------------------------------------------

function ChannelList() {
  const { data: channels, isLoading } = useSupportChannels();
  const selectedChannelId = useSupportStore((s) => s.selectedChannelId);
  const setSelectedChannelId = useSupportStore((s) => s.setSelectedChannelId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <nav aria-label="Support channels">
      <button
        type="button"
        onClick={() => setSelectedChannelId(null)}
        className={cn(
          "mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          !selectedChannelId
            ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Headphones className="h-4 w-4" aria-hidden />
        All Channels
      </button>
      <Separator className="my-2" />
      {!channels?.length ? (
        <p className="text-muted-foreground px-3 py-2 text-xs">No channels configured</p>
      ) : (
        <ul className="space-y-1">
          {channels.map((channel: SupportChannel) => (
            <li key={channel.id}>
              <button
                type="button"
                onClick={() => setSelectedChannelId(channel.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  selectedChannelId === channel.id
                    ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <ChannelIcon type={channel.type} />
                <span className="flex-1 truncate text-left">{channel.name}</span>
                {channel.status === "error" && (
                  <span className="bg-destructive h-2 w-2 rounded-full" aria-label="Error" />
                )}
                {channel.status === "inactive" && (
                  <span
                    className="bg-muted-foreground/40 h-2 w-2 rounded-full"
                    aria-label="Inactive"
                  />
                )}
                {channel.status === "active" && (
                  <span className="h-2 w-2 rounded-full bg-teal-500" aria-label="Active" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Ticket list
// ---------------------------------------------------------------------------

function TicketListItem({ ticket }: { ticket: SupportTicket }) {
  const selectedTicketId = useSupportStore((s) => s.selectedTicketId);
  const setSelectedTicketId = useSupportStore((s) => s.setSelectedTicketId);
  const isSelected = selectedTicketId === ticket.id;

  return (
    <button
      type="button"
      onClick={() => setSelectedTicketId(ticket.id)}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg border px-4 py-3 text-left transition-colors",
        isSelected ? "border-teal-500/50 bg-teal-500/5" : "border-border bg-card hover:bg-muted/50",
      )}
      aria-current={isSelected ? "true" : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-foreground line-clamp-1 text-sm font-medium">{ticket.subject}</span>
        <ChevronRight className="text-muted-foreground mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={STATUS_VARIANTS[ticket.status]} className="text-[10px]">
          {ticketStatusLabel(ticket.status)}
        </Badge>
        <Badge variant={PRIORITY_VARIANTS[ticket.priority]} className="text-[10px]">
          {priorityLabel(ticket.priority)}
        </Badge>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>{ticket.contactName ?? "Unknown"}</span>
        <span>{formatTime(ticket.updatedAt)}</span>
      </div>
    </button>
  );
}

function TicketList() {
  const { data: tickets, isLoading, isError, refetch } = useSupportTickets();
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!tickets) return [];
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        (t.contactName?.toLowerCase().includes(q) ?? false) ||
        (t.contactEmail?.toLowerCase().includes(q) ?? false),
    );
  }, [tickets, search]);

  return (
    <div className="flex h-full flex-col gap-3">
      <Input
        placeholder="Search tickets…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
        aria-label="Search tickets"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <EmptyState
          icon={Headphones}
          title="Couldn't load tickets"
          description="Something went wrong fetching support tickets."
          actionLabel="Retry"
          onAction={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <EmptyState
          icon={Headphones}
          title="No tickets found"
          description={
            search
              ? "No tickets match your search."
              : "No support tickets yet. Tickets will appear here when customers reach out."
          }
          className="flex-1"
        />
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <ul className="space-y-2 overflow-y-auto" aria-label="Ticket list">
          {filtered.map((ticket) => (
            <li key={ticket.id}>
              <TicketListItem ticket={ticket} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Message thread
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: SupportMessage }) {
  const isOutbound = message.direction === "outbound";

  return (
    <div className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isOutbound
            ? "rounded-br-sm bg-teal-600 text-white dark:bg-teal-500"
            : "bg-muted text-foreground rounded-bl-sm",
        )}
      >
        {message.isAi && (
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">
            <Sparkles className="h-3 w-3" />
            AI Generated
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={cn("mt-1 text-[10px]", isOutbound ? "text-white/60" : "text-muted-foreground")}
        >
          {message.authorName ? `${message.authorName} · ` : ""}
          {formatTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function MessageThread({ ticketId }: { ticketId: string }) {
  const { data: messages, isLoading } = useSupportMessages(ticketId);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn("h-14 rounded-2xl", i % 2 === 0 ? "w-2/3" : "ml-auto w-1/2")}
          />
        ))}
      </div>
    );
  }

  if (!messages?.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Messages from the customer will appear here."
        className="m-4"
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((msg: SupportMessage) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reply composer
// ---------------------------------------------------------------------------

function ReplyComposer({ ticket }: { ticket: SupportTicket }) {
  const replyDraft = useSupportStore((s) => s.replyDraft);
  const setReplyDraft = useSupportStore((s) => s.setReplyDraft);
  const { mutate: reply, isPending: replying } = useReplyToTicket();
  const { mutate: aiReply, isPending: aiReplying } = useAiReply();

  function handleSend() {
    if (!replyDraft.trim()) return;
    reply({ ticketId: ticket.id, payload: { content: replyDraft } });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <div className="border-border bg-background border-t p-3">
      {isResolved && (
        <p className="bg-muted text-muted-foreground mb-2 rounded-md px-3 py-1.5 text-xs">
          This ticket is {ticket.status}. You can still send a message.
        </p>
      )}
      <Textarea
        value={replyDraft}
        onChange={(e) => setReplyDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply… (⌘ + Enter to send)"
        className="mb-2 min-h-[72px] resize-none text-sm"
        aria-label="Reply composer"
      />
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => aiReply(ticket.id)}
          disabled={aiReplying}
          className="gap-1.5"
        >
          {aiReplying ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          )}
          AI Reply
        </Button>
        <Button
          size="sm"
          onClick={handleSend}
          disabled={!replyDraft.trim() || replying}
          className="gap-1.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
        >
          {replying ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Send className="h-3.5 w-3.5" aria-hidden />
          )}
          Send
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ticket detail panel
// ---------------------------------------------------------------------------

function TicketDetail({ ticketId }: { ticketId: string }) {
  const { data: tickets } = useSupportTickets();
  const { data: channels } = useSupportChannels();

  const ticket = tickets?.find((t) => t.id === ticketId);
  const channel = channels?.find((c) => c.id === ticket?.channelId);

  if (!ticket) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Ticket header */}
      <div className="border-border bg-background border-b px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-foreground text-base font-semibold">{ticket.subject}</h2>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
              {ticket.contactName && <span>{ticket.contactName}</span>}
              {ticket.contactEmail && (
                <>
                  <span aria-hidden>·</span>
                  <span>{ticket.contactEmail}</span>
                </>
              )}
              {channel && (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <ChannelIcon type={channel.type} className="h-3 w-3" />
                    {channel.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={STATUS_VARIANTS[ticket.status]}>
              {ticketStatusLabel(ticket.status)}
            </Badge>
            <Badge variant={PRIORITY_VARIANTS[ticket.priority]}>
              {priorityLabel(ticket.priority)}
            </Badge>
          </div>
        </div>
        {ticket.assigneeName && (
          <p className="text-muted-foreground mt-2 text-xs">
            Assigned to <span className="text-foreground font-medium">{ticket.assigneeName}</span>
          </p>
        )}
      </div>

      {/* Message thread */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageThread ticketId={ticketId} />
      </div>

      {/* Reply composer */}
      <ReplyComposer ticket={ticket} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main support inbox
// ---------------------------------------------------------------------------

export function SupportInbox() {
  const selectedTicketId = useSupportStore((s) => s.selectedTicketId);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Support"
        description="Manage customer conversations across all connected channels."
      />

      {/* Stats strip */}
      <div className="mb-6">
        <StatsStrip />
      </div>

      {/* Inbox layout */}
      <div className="border-border bg-background flex flex-1 gap-0 overflow-hidden rounded-xl border">
        {/* Channel sidebar */}
        <aside className="border-border hidden w-48 shrink-0 flex-col gap-0 border-r p-3 lg:flex">
          <p className="text-muted-foreground mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider">
            Channels
          </p>
          <ChannelList />
        </aside>

        {/* Ticket list */}
        <div className="border-border flex w-72 shrink-0 flex-col border-r p-3">
          <p className="text-muted-foreground mb-3 text-[10px] font-semibold uppercase tracking-wider">
            Tickets
          </p>
          <TicketList />
        </div>

        {/* Detail panel */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedTicketId ? (
            <TicketDetail ticketId={selectedTicketId} />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                icon={Headphones}
                title="Select a ticket"
                description="Choose a ticket from the list to view messages and reply."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
