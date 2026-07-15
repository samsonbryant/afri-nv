import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickNumber, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  KnowledgeChatPayload,
  KnowledgeChunk,
  KnowledgeConversation,
  KnowledgeDocument,
  KnowledgeDocStatus,
  KnowledgeMessage,
} from "@/features/knowledge/types";

const demoDocuments: KnowledgeDocument[] = [
  {
    id: "kd-1",
    title: "Employee Handbook 2026",
    filename: "handbook-2026.pdf",
    mimeType: "application/pdf",
    size: 1_240_000,
    status: "ready",
    chunkCount: 42,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "kd-2",
    title: "Q2 Sales Playbook",
    filename: "q2-sales.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 420_000,
    status: "processing",
    chunkCount: 0,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

const demoChunks: Record<string, KnowledgeChunk[]> = {
  "kd-1": [
    {
      id: "ch-1",
      documentId: "kd-1",
      index: 0,
      content:
        "Parental leave is available for up to 16 weeks following the birth or adoption of a child.",
      tokenCount: 28,
    },
    {
      id: "ch-2",
      documentId: "kd-1",
      index: 1,
      content: "PTO accrues at 1.5 days per month with a maximum balance of 30 days.",
      tokenCount: 22,
    },
  ],
};

const demoConversations: KnowledgeConversation[] = [
  {
    id: "kc-1",
    title: "Leave policy questions",
    preview: "How much parental leave do we offer?",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const demoMessages: Record<string, KnowledgeMessage[]> = {
  "kc-1": [
    {
      id: "km-1",
      conversationId: "kc-1",
      role: "user",
      content: "How much parental leave do we offer?",
      createdAt: new Date(Date.now() - 3700000).toISOString(),
    },
    {
      id: "km-2",
      conversationId: "kc-1",
      role: "assistant",
      content:
        "Your handbook states parental leave is available for **up to 16 weeks** following birth or adoption.",
      citations: [
        {
          id: "cite-1",
          documentId: "kd-1",
          title: "Employee Handbook 2026",
          snippet: "Parental leave is available for up to 16 weeks…",
        },
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

function mapStatus(value: unknown): KnowledgeDocStatus {
  const status = String(value ?? "pending").toLowerCase();
  if (
    status === "pending" ||
    status === "processing" ||
    status === "ready" ||
    status === "failed"
  ) {
    return status;
  }
  if (status === "complete" || status === "completed" || status === "indexed") {
    return "ready";
  }
  if (status === "error") return "failed";
  return "pending";
}

function mapDocument(raw: Record<string, unknown>): KnowledgeDocument {
  return {
    id: String(raw.id),
    title: pickString(raw, "title", "name") || "Untitled",
    filename: pickString(raw, "filename", "file_name", "name") || "file",
    mimeType:
      pickString(raw, "mimeType", "mime_type", "content_type") || "application/octet-stream",
    size: pickNumber(raw, "size", "file_size"),
    status: mapStatus(raw.status),
    chunkCount: pickNumber(raw, "chunkCount", "chunk_count", "chunks"),
    errorMessage:
      (raw.errorMessage as string | null | undefined) ??
      (raw.error_message as string | null | undefined) ??
      null,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapChunk(raw: Record<string, unknown>): KnowledgeChunk {
  return {
    id: String(raw.id),
    documentId: String(raw.documentId ?? raw.document_id ?? ""),
    index: pickNumber(raw, "index", "chunk_index", "position"),
    content: pickString(raw, "content", "text"),
    tokenCount: pickNumber(raw, "tokenCount", "token_count", "tokens") || undefined,
  };
}

function mapConversation(raw: Record<string, unknown>): KnowledgeConversation {
  return {
    id: String(raw.id),
    title: pickString(raw, "title") || "Conversation",
    preview: pickString(raw, "preview") || undefined,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapMessage(raw: Record<string, unknown>): KnowledgeMessage {
  const citationsRaw = raw.citations;
  const citations = Array.isArray(citationsRaw)
    ? citationsRaw.map((item, index) => {
        const c = item as Record<string, unknown>;
        return {
          id: String(c.id ?? `cite-${index}`),
          documentId: c.documentId
            ? String(c.documentId)
            : c.document_id
              ? String(c.document_id)
              : undefined,
          title: pickString(c, "title") || "Source",
          snippet: pickString(c, "snippet", "content") || undefined,
          url: (c.url as string | null | undefined) ?? null,
        };
      })
    : undefined;

  return {
    id: String(raw.id),
    conversationId: String(raw.conversationId ?? raw.conversation_id ?? ""),
    role: (pickString(raw, "role") || "assistant") as KnowledgeMessage["role"],
    content: pickString(raw, "content"),
    citations,
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

export async function fetchKnowledgeDocuments(
  organizationId?: string | null,
): Promise<KnowledgeDocument[]> {
  if (isDemoMode()) return demoDocuments;

  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.knowledge.documents, organizationId));
    return unwrapList(payload).map(mapDocument);
  } catch {
    return [];
  }
}

export async function uploadKnowledgeDocument(
  file: File,
  organizationId?: string | null,
): Promise<KnowledgeDocument> {
  if (isDemoMode()) {
    const doc: KnowledgeDocument = {
      id: `kd-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      status: "processing",
      chunkCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoDocuments.unshift(doc);
    return doc;
  }

  const form = new FormData();
  form.append("file", file);
  if (organizationId) form.append("organization_id", organizationId);

  const payload = await api.post<Record<string, unknown>>(API_ENDPOINTS.knowledge.upload, form);
  return mapDocument(payload);
}

export async function fetchDocumentChunks(
  documentId: string,
  organizationId?: string | null,
): Promise<KnowledgeChunk[]> {
  if (isDemoMode()) return demoChunks[documentId] ?? [];

  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.knowledge.chunks(documentId), organizationId));
    return unwrapList(payload).map(mapChunk);
  } catch {
    return [];
  }
}

export async function fetchKnowledgeConversations(
  organizationId?: string | null,
): Promise<KnowledgeConversation[]> {
  if (isDemoMode()) return demoConversations;

  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.knowledge.conversations, organizationId));
    return unwrapList(payload).map(mapConversation);
  } catch {
    return [];
  }
}

export async function fetchKnowledgeMessages(
  conversationId: string,
  organizationId?: string | null,
): Promise<KnowledgeMessage[]> {
  if (isDemoMode()) return demoMessages[conversationId] ?? [];

  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.knowledge.messages(conversationId), organizationId));
    return unwrapList(payload).map(mapMessage);
  } catch {
    return [];
  }
}

export async function sendKnowledgeChat(
  payload: KnowledgeChatPayload,
  organizationId?: string | null,
): Promise<{
  conversation: KnowledgeConversation;
  userMessage: KnowledgeMessage;
  assistantMessage: KnowledgeMessage;
}> {
  if (isDemoMode()) {
    let conversationId = payload.conversationId;
    let conversation = demoConversations.find((c) => c.id === conversationId);

    if (!conversation) {
      conversation = {
        id: `kc-${Date.now()}`,
        title: payload.content.slice(0, 48) || "New chat",
        preview: payload.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      demoConversations.unshift(conversation);
      conversationId = conversation.id;
      demoMessages[conversationId] = [];
    }

    const userMessage: KnowledgeMessage = {
      id: `ku-${Date.now()}`,
      conversationId: conversationId!,
      role: "user",
      content: payload.content,
      createdAt: new Date().toISOString(),
    };

    const assistantMessage: KnowledgeMessage = {
      id: `ka-${Date.now()}`,
      conversationId: conversationId!,
      role: "assistant",
      content: `Based on your knowledge base:\n\n> ${payload.content}\n\nI found relevant passages in indexed documents.`,
      citations: [
        {
          id: "demo-cite",
          documentId: "kd-1",
          title: "Employee Handbook 2026",
          snippet: "Generated in demo mode",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    demoMessages[conversationId!] = [
      ...(demoMessages[conversationId!] ?? []),
      userMessage,
      assistantMessage,
    ];
    conversation.updatedAt = new Date().toISOString();
    conversation.preview = payload.content;

    return { conversation, userMessage, assistantMessage };
  }

  let conversationId = payload.conversationId;

  if (!conversationId) {
    const created = await api.post<Record<string, unknown>>(
      withOrg(API_ENDPOINTS.knowledge.conversations, organizationId),
      {
        organization_id: organizationId,
        title: payload.content.slice(0, 48) || "New chat",
      },
    );
    conversationId = String(created.id);
  }

  const response = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.knowledge.messages(conversationId), organizationId),
    {
      content: payload.content,
      document_ids: payload.documentIds,
    },
  );

  const conversationRaw = (response.conversation as Record<string, unknown> | undefined) ?? {
    id: conversationId,
    title: payload.content.slice(0, 48) || "New chat",
  };

  const userRaw =
    (response.user_message as Record<string, unknown> | undefined) ??
    (response.userMessage as Record<string, unknown> | undefined);
  const assistantRaw =
    (response.assistant_message as Record<string, unknown> | undefined) ??
    (response.assistantMessage as Record<string, unknown> | undefined) ??
    (response.reply as Record<string, unknown> | undefined);

  return {
    conversation: mapConversation(conversationRaw),
    userMessage: userRaw
      ? mapMessage(userRaw)
      : {
          id: `local-u-${Date.now()}`,
          conversationId: String(conversationRaw.id),
          role: "user",
          content: payload.content,
          createdAt: new Date().toISOString(),
        },
    assistantMessage: assistantRaw
      ? mapMessage(assistantRaw)
      : {
          id: `local-a-${Date.now()}`,
          conversationId: String(conversationRaw.id),
          role: "assistant",
          content:
            typeof response.content === "string" ? response.content : "No response received.",
          createdAt: new Date().toISOString(),
        },
  };
}

export async function deleteKnowledgeDocument(
  id: string,
  organizationId?: string | null,
): Promise<void> {
  if (isDemoMode()) {
    const index = demoDocuments.findIndex((d) => d.id === id);
    if (index >= 0) demoDocuments.splice(index, 1);
    return;
  }
  await api.delete(withOrg(API_ENDPOINTS.knowledge.document(id), organizationId));
}
