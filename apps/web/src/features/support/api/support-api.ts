import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickNumber, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  ChannelStatus,
  ChannelType,
  MessageDirection,
  SupportChannel,
  SupportMessage,
  SupportStats,
  SupportTicket,
  TicketPriority,
  TicketStatus,
} from "@/features/support/types";

const now = Date.now();

const demoChannels: SupportChannel[] = [
  {
    id: "ch-wa",
    name: "WhatsApp Business",
    type: "whatsapp",
    status: "active",
    ticketCount: 8,
    createdAt: new Date(now - 86400000 * 30).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString(),
  },
  {
    id: "ch-email",
    name: "Support Email",
    type: "email",
    status: "active",
    ticketCount: 14,
    createdAt: new Date(now - 86400000 * 40).toISOString(),
    updatedAt: new Date(now - 7200000).toISOString(),
  },
  {
    id: "ch-web",
    name: "Website Chat",
    type: "webchat",
    status: "active",
    ticketCount: 5,
    createdAt: new Date(now - 86400000 * 20).toISOString(),
    updatedAt: new Date(now - 86400000).toISOString(),
  },
  {
    id: "ch-msg",
    name: "Messenger",
    type: "messenger",
    status: "inactive",
    ticketCount: 0,
    createdAt: new Date(now - 86400000 * 10).toISOString(),
    updatedAt: new Date(now - 86400000 * 5).toISOString(),
  },
];

let demoTickets: SupportTicket[] = [
  {
    id: "tk-1",
    subject: "Cannot reset workspace password",
    status: "open",
    priority: "high",
    channelId: "ch-email",
    contactName: "Jordan Lee",
    contactEmail: "jordan@example.com",
    preview: "I keep getting an invalid token error…",
    createdAt: new Date(now - 7200000).toISOString(),
    updatedAt: new Date(now - 1800000).toISOString(),
  },
  {
    id: "tk-2",
    subject: "Invoice PDF missing attachments",
    status: "pending",
    priority: "medium",
    channelId: "ch-wa",
    contactName: "Priya Shah",
    preview: "The PDF exported empty pages…",
    createdAt: new Date(now - 86400000).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString(),
  },
  {
    id: "tk-3",
    subject: "How do I invite a teammate?",
    status: "resolved",
    priority: "low",
    channelId: "ch-web",
    contactName: "Sam Ortiz",
    preview: "Thanks, that worked!",
    createdAt: new Date(now - 86400000 * 2).toISOString(),
    updatedAt: new Date(now - 86400000).toISOString(),
  },
];

const demoMessages: Record<string, SupportMessage[]> = {
  "tk-1": [
    {
      id: "sm-1",
      ticketId: "tk-1",
      direction: "inbound",
      content: "I keep getting an invalid token error when trying to reset my password.",
      authorName: "Jordan Lee",
      createdAt: new Date(now - 7200000).toISOString(),
    },
    {
      id: "sm-2",
      ticketId: "tk-1",
      direction: "outbound",
      content: "Thanks for reporting this — can you confirm which email you used for the reset?",
      authorName: "Support",
      createdAt: new Date(now - 6000000).toISOString(),
    },
  ],
  "tk-2": [
    {
      id: "sm-3",
      ticketId: "tk-2",
      direction: "inbound",
      content: "The PDF exported empty pages for last month’s invoices.",
      authorName: "Priya Shah",
      createdAt: new Date(now - 86400000).toISOString(),
    },
  ],
  "tk-3": [
    {
      id: "sm-4",
      ticketId: "tk-3",
      direction: "inbound",
      content: "How do I invite a teammate?",
      authorName: "Sam Ortiz",
      createdAt: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: "sm-5",
      ticketId: "tk-3",
      direction: "outbound",
      content: "Go to Settings → Members → Invite, then enter their email.",
      authorName: "Support",
      createdAt: new Date(now - 86400000 * 2 + 600000).toISOString(),
    },
  ],
};

function mapChannelType(value: unknown): ChannelType {
  const type = String(value ?? "email").toLowerCase();
  const allowed: ChannelType[] = ["whatsapp", "messenger", "email", "slack", "webchat", "sms"];
  if (type === "web") return "webchat";
  return allowed.includes(type as ChannelType) ? (type as ChannelType) : "email";
}

function mapChannelStatus(value: unknown): ChannelStatus {
  const status = String(value ?? "active").toLowerCase();
  if (status === "connected" || status === "active") return "active";
  if (status === "error") return "error";
  return "inactive";
}

function mapTicketStatus(value: unknown): TicketStatus {
  const status = String(value ?? "open").toLowerCase();
  const allowed: TicketStatus[] = ["open", "pending", "resolved", "closed"];
  return allowed.includes(status as TicketStatus) ? (status as TicketStatus) : "open";
}

function mapPriority(value: unknown): TicketPriority {
  const priority = String(value ?? "medium").toLowerCase();
  const allowed: TicketPriority[] = ["low", "medium", "high", "urgent"];
  return allowed.includes(priority as TicketPriority) ? (priority as TicketPriority) : "medium";
}

function mapDirection(value: unknown): MessageDirection {
  const direction = String(value ?? "inbound").toLowerCase();
  if (direction === "outbound" || direction === "agent" || direction === "ai") {
    return "outbound";
  }
  return "inbound";
}

function mapChannel(raw: Record<string, unknown>): SupportChannel {
  return {
    id: String(raw.id),
    name: pickString(raw, "name") || "Channel",
    type: mapChannelType(raw.type),
    status: mapChannelStatus(raw.status),
    ticketCount: pickNumber(raw, "ticketCount", "ticket_count") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapTicket(raw: Record<string, unknown>): SupportTicket {
  return {
    id: String(raw.id),
    subject: pickString(raw, "subject", "title") || "Ticket",
    status: mapTicketStatus(raw.status),
    priority: mapPriority(raw.priority),
    channelId: String(raw.channelId ?? raw.channel_id ?? ""),
    contactName:
      pickString(raw, "contactName", "contact_name", "requesterName", "requester_name") ||
      undefined,
    contactEmail: pickString(raw, "contactEmail", "contact_email", "requesterEmail") || undefined,
    assigneeName: pickString(raw, "assigneeName", "assignee_name") || undefined,
    preview: pickString(raw, "preview", "last_message") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapMessage(raw: Record<string, unknown>): SupportMessage {
  const role = pickString(raw, "role", "sender_type");
  const direction =
    raw.direction != null
      ? mapDirection(raw.direction)
      : role === "agent" || role === "ai"
        ? "outbound"
        : "inbound";
  return {
    id: String(raw.id),
    ticketId: String(raw.ticketId ?? raw.ticket_id ?? ""),
    direction,
    content: pickString(raw, "content", "body", "message"),
    authorName: pickString(raw, "authorName", "author_name", "sender") || undefined,
    isAi: Boolean(raw.isAi ?? raw.is_ai ?? role === "ai"),
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

export async function fetchChannels(organizationId?: string | null): Promise<SupportChannel[]> {
  if (isDemoMode()) return demoChannels;
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.support.channels, organizationId));
    return unwrapList(payload).map(mapChannel);
  } catch {
    return [];
  }
}

export async function fetchTickets(
  organizationId?: string | null,
  channelId?: string | null,
): Promise<SupportTicket[]> {
  if (isDemoMode()) {
    return channelId ? demoTickets.filter((t) => t.channelId === channelId) : [...demoTickets];
  }
  try {
    let path = withOrg(API_ENDPOINTS.support.tickets, organizationId);
    if (channelId) {
      path += `${path.includes("?") ? "&" : "?"}channel_id=${encodeURIComponent(channelId)}`;
    }
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(path);
    return unwrapList(payload).map(mapTicket);
  } catch {
    return [];
  }
}

export async function fetchTicketMessages(
  ticketId: string,
  organizationId?: string | null,
): Promise<SupportMessage[]> {
  if (isDemoMode()) return demoMessages[ticketId] ?? [];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.support.messages(ticketId), organizationId));
    return unwrapList(payload).map(mapMessage);
  } catch {
    return [];
  }
}

export async function replyToTicket(
  ticketId: string,
  content: string,
  organizationId?: string | null,
): Promise<SupportMessage> {
  if (isDemoMode()) {
    const message: SupportMessage = {
      id: `sm-${Date.now()}`,
      ticketId,
      direction: "outbound",
      content,
      authorName: "You",
      createdAt: new Date().toISOString(),
    };
    demoMessages[ticketId] = [...(demoMessages[ticketId] ?? []), message];
    demoTickets = demoTickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: t.status === "resolved" ? t.status : "pending",
            preview: content,
            updatedAt: new Date().toISOString(),
          }
        : t,
    );
    return message;
  }
  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.support.reply(ticketId), organizationId),
    { content, organization_id: organizationId },
  );
  return mapMessage(payload);
}

export async function generateAiReply(
  ticketId: string,
  organizationId?: string | null,
): Promise<{ suggestion: string }> {
  if (isDemoMode()) {
    const ticket = demoTickets.find((t) => t.id === ticketId);
    return {
      suggestion: `Hi ${ticket?.contactName ?? "there"},\n\nThanks for reaching out about “${ticket?.subject ?? "your issue"}”. I’m looking into this and will follow up shortly with next steps.\n\nBest regards,\nSupport`,
    };
  }
  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.support.aiReply(ticketId), organizationId),
    { organization_id: organizationId },
  );
  return {
    suggestion:
      pickString(payload, "suggestion", "content", "reply", "message") || "AI reply unavailable.",
  };
}

export async function fetchSupportStats(organizationId?: string | null): Promise<SupportStats> {
  if (isDemoMode()) {
    const open = demoTickets.filter((t) => t.status === "open").length;
    const pending = demoTickets.filter((t) => t.status === "pending").length;
    const resolved = demoTickets.filter((t) => t.status === "resolved").length;
    return { open, pending, resolved, total: demoTickets.length };
  }
  try {
    const payload = await api.get<Record<string, unknown>>(
      withOrg(API_ENDPOINTS.support.stats, organizationId),
    );
    const open = pickNumber(payload, "open");
    const pending = pickNumber(payload, "pending");
    const resolved = pickNumber(payload, "resolved");
    const total = pickNumber(payload, "total") || open + pending + resolved;
    return { open, pending, resolved, total };
  } catch {
    return { open: 0, pending: 0, resolved: 0, total: 0 };
  }
}
