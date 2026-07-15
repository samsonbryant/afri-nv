export type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string | null;
  secret?: string;
};

export type WebhookEndpoint = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateApiKeyInput = {
  name: string;
};

export type CreateWebhookInput = {
  url: string;
  events: string[];
};
