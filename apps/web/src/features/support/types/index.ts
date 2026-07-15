export type ChannelType = "whatsapp" | "messenger" | "email" | "slack" | "webchat" | "sms";

export type ChannelStatus = "active" | "inactive" | "error";

export type SupportChannel = {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  ticketCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type TicketStatus = "open" | "pending" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicket = {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  channelId: string;
  contactName?: string;
  contactEmail?: string;
  assigneeName?: string;
  preview?: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageDirection = "inbound" | "outbound";

export type SupportMessage = {
  id: string;
  ticketId: string;
  direction: MessageDirection;
  content: string;
  authorName?: string;
  isAi?: boolean;
  createdAt: string;
};

export type SupportStats = {
  open: number;
  pending: number;
  resolved: number;
  total: number;
};

export type ReplyPayload = {
  content: string;
};
