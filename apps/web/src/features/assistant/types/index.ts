export type AssistantRole = "user" | "assistant" | "system";

export type AssistantCitation = {
  id: string;
  title: string;
  url?: string | null;
  snippet?: string;
};

export type AssistantAttachment = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  kind: "image" | "file";
};

export type AssistantMessage = {
  id: string;
  conversationId: string;
  role: AssistantRole;
  content: string;
  createdAt: string;
  citations?: AssistantCitation[];
  attachments?: AssistantAttachment[];
};

export type AssistantConversation = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  preview?: string;
};

export type SendMessageAttachment = {
  url: string;
  name: string;
  mimeType?: string;
  content_type?: string;
  size?: number;
};

export type SendMessagePayload = {
  conversationId?: string | null;
  content: string;
  attachments?: SendMessageAttachment[];
};

export type UploadResult = {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  kind: "image" | "file";
  size?: number;
};
