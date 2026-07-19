import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  AssistantConversation,
  AssistantMessage,
  SendMessagePayload,
  UploadResult,
} from "@/features/assistant/types";

type BackendConversation = {
  id: string;
  title: string;
  updated_at?: string;
  updatedAt?: string;
  created_at?: string;
  createdAt?: string;
  preview?: string;
};

type BackendMessage = {
  id: string;
  conversation_id?: string;
  conversationId?: string;
  role: AssistantMessage["role"];
  content: string;
  created_at?: string;
  createdAt?: string;
  citations?: AssistantMessage["citations"];
  attachments?: AssistantMessage["attachments"];
};

const demoConversations: AssistantConversation[] = [
  {
    id: "demo-c1",
    title: "Q2 policy summary",
    preview: "What changed in our leave policy?",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const demoMessages: Record<string, AssistantMessage[]> = {
  "demo-c1": [
    {
      id: "m1",
      conversationId: "demo-c1",
      role: "user",
      content: "What changed in our leave policy?",
      createdAt: new Date(Date.now() - 3700000).toISOString(),
    },
    {
      id: "m2",
      conversationId: "demo-c1",
      role: "assistant",
      content:
        "Parental leave increased to **16 weeks**, and the accrual cap for PTO is now **30 days**.\n\n```ts\nconst leaveWeeks = 16;\n```",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      citations: [
        {
          id: "c1",
          title: "Employee Handbook 2026",
          snippet: "Section 4.2 Parental leave",
        },
      ],
    },
  ],
};

function mapConversation(raw: BackendConversation, index = 0): AssistantConversation {
  const id = String(raw.id ?? "").trim() || `conversation-${index}`;
  return {
    id,
    title: raw.title || "Untitled",
    preview: raw.preview,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
  };
}

function mapMessage(raw: BackendMessage, index = 0): AssistantMessage {
  const id = String(raw.id ?? "").trim() || `message-${index}`;
  return {
    id,
    conversationId: String(raw.conversationId ?? raw.conversation_id ?? ""),
    role: raw.role,
    content: raw.content,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    citations: raw.citations?.map((citation, citeIndex) => ({
      ...citation,
      id: citation.id || `cite-${id}-${citeIndex}`,
    })),
    attachments: raw.attachments?.map((attachment, attachIndex) => ({
      ...attachment,
      id: attachment.id || `attach-${id}-${attachIndex}`,
    })),
  };
}

export async function fetchConversations(
  organizationId?: string | null,
): Promise<AssistantConversation[]> {
  if (isDemoMode()) return demoConversations;
  if (!organizationId) return [];

  try {
    const payload = await api.get<BackendConversation[] | { results: BackendConversation[] }>(
      withOrg(API_ENDPOINTS.assistant.conversations, organizationId),
    );
    return unwrapList(payload).map(mapConversation);
  } catch {
    return [];
  }
}

export async function createConversation(
  title = "New chat",
  organizationId?: string | null,
): Promise<AssistantConversation> {
  if (!organizationId) {
    throw new ApiError("Select or create a workspace before chatting.", {
      status: 400,
      code: "organization_required",
    });
  }
  if (isDemoMode()) {
    const conversation: AssistantConversation = {
      id: `demo-c-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoConversations.unshift(conversation);
    demoMessages[conversation.id] = [];
    return conversation;
  }

  const payload = await api.post<BackendConversation>(
    withOrg(API_ENDPOINTS.assistant.conversations, organizationId),
    {
      title,
      organization_id: organizationId,
    },
  );
  return mapConversation(payload);
}

export async function fetchMessages(
  conversationId: string,
  organizationId?: string | null,
): Promise<AssistantMessage[]> {
  if (isDemoMode()) {
    return demoMessages[conversationId] ?? [];
  }

  try {
    const payload = await api.get<BackendMessage[] | { results: BackendMessage[] }>(
      withOrg(API_ENDPOINTS.assistant.messages(conversationId), organizationId),
    );
    return unwrapList(payload).map(mapMessage);
  } catch {
    return [];
  }
}

export async function sendMessage(
  payload: SendMessagePayload,
  organizationId?: string | null,
): Promise<{
  conversation: AssistantConversation;
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
}> {
  if (isDemoMode()) {
    let conversationId = payload.conversationId;
    let conversation = demoConversations.find((c) => c.id === conversationId);

    if (!conversation) {
      conversation = await createConversation(
        payload.content.slice(0, 48) || "New chat",
        organizationId,
      );
      conversationId = conversation.id;
    }

    const userMessage: AssistantMessage = {
      id: `u-${Date.now()}`,
      conversationId: conversationId!,
      role: "user",
      content: payload.content,
      createdAt: new Date().toISOString(),
    };

    const assistantMessage: AssistantMessage = {
      id: `a-${Date.now()}`,
      conversationId: conversationId!,
      role: "assistant",
      content: `Here's a helpful response to:\n\n> ${payload.content}\n\nI can expand on any part of this.`,
      createdAt: new Date().toISOString(),
      citations: [
        {
          id: "demo-cite",
          title: "Workspace knowledge",
          snippet: "Generated in demo mode",
        },
      ],
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
    const created = await createConversation(
      payload.content.slice(0, 48) || "New chat",
      organizationId,
    );
    conversationId = created.id;
  }

  const response = await api.post<{
    conversation?: BackendConversation;
    user_message?: BackendMessage;
    userMessage?: BackendMessage;
    assistant_message?: BackendMessage;
    assistantMessage?: BackendMessage;
    message?: BackendMessage;
    reply?: BackendMessage;
  }>(withOrg(API_ENDPOINTS.assistant.messages(conversationId), organizationId), {
    content: payload.content,
    attachments: (payload.attachments ?? []).map((attachment) => ({
      url: attachment.url,
      name: attachment.name,
      content_type: attachment.mimeType ?? attachment.content_type,
      size: attachment.size,
    })),
  });

  const conversation = response.conversation
    ? mapConversation(response.conversation)
    : {
        id: conversationId,
        title: payload.content.slice(0, 48) || "New chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  const userRaw = response.userMessage ?? response.user_message;
  const assistantRaw =
    response.assistantMessage ?? response.assistant_message ?? response.reply ?? response.message;

  const userMessage = userRaw
    ? mapMessage(userRaw)
    : {
        id: `local-u-${Date.now()}`,
        conversationId,
        role: "user" as const,
        content: payload.content,
        createdAt: new Date().toISOString(),
      };

  const assistantMessage = assistantRaw
    ? mapMessage(assistantRaw)
    : {
        id: `local-a-${Date.now()}`,
        conversationId,
        role: "assistant" as const,
        content: "No response received.",
        createdAt: new Date().toISOString(),
      };

  return { conversation, userMessage, assistantMessage };
}

export async function uploadAssistantFile(
  file: File,
  organizationId?: string | null,
): Promise<UploadResult> {
  if (isDemoMode()) {
    const url = URL.createObjectURL(file);
    return {
      id: `upload-${Date.now()}`,
      name: file.name,
      mimeType: file.type,
      url,
      kind: file.type.startsWith("image/") ? "image" : "file",
      size: file.size,
    };
  }

  const form = new FormData();
  form.append("file", file);

  const payload = await api.post<{
    id?: string;
    name?: string;
    filename?: string;
    mime_type?: string;
    mimeType?: string;
    content_type?: string;
    url: string;
    size?: number;
    kind?: "image" | "file";
  }>(withOrg(API_ENDPOINTS.assistant.uploads, organizationId), form);

  const mimeType = payload.mimeType ?? payload.mime_type ?? payload.content_type ?? file.type;
  return {
    id: String(payload.id ?? `upload-${Date.now()}-${file.name}`),
    name: payload.name ?? payload.filename ?? file.name,
    mimeType,
    url: payload.url,
    kind: payload.kind ?? (mimeType.startsWith("image/") ? "image" : "file"),
    size: payload.size ?? file.size,
  };
}

export async function deleteConversation(
  id: string,
  organizationId?: string | null,
): Promise<void> {
  if (isDemoMode()) {
    const index = demoConversations.findIndex((c) => c.id === id);
    if (index >= 0) demoConversations.splice(index, 1);
    delete demoMessages[id];
    return;
  }
  await api.delete(withOrg(API_ENDPOINTS.assistant.conversation(id), organizationId));
}
