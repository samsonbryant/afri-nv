export type KnowledgeDocStatus = "pending" | "processing" | "ready" | "failed";

export type KnowledgeDocument = {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  status: KnowledgeDocStatus;
  chunkCount?: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  index: number;
  content: string;
  tokenCount?: number;
};

export type KnowledgeCitation = {
  id: string;
  documentId?: string;
  title: string;
  snippet?: string;
  url?: string | null;
};

export type KnowledgeMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations?: KnowledgeCitation[];
  createdAt: string;
};

export type KnowledgeConversation = {
  id: string;
  title: string;
  preview?: string;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeChatPayload = {
  conversationId?: string | null;
  content: string;
  documentIds?: string[];
};
