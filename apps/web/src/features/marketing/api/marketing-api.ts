import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  ConnectSocialInput,
  CreateFacebookAdInput,
  FacebookAd,
  GenerateMarketingInput,
  MarketingAsset,
  MarketingAssetType,
  MarketingCampaign,
  MarketingTone,
  PublishSocialPostInput,
  SocialConnection,
  SocialPost,
} from "@/features/marketing/types";
import { ASSET_TYPE_LABELS } from "@/features/marketing/types";

const now = Date.now();

let demoAssets: MarketingAsset[] = [
  {
    id: "ma-1",
    type: "linkedin",
    title: "LinkedIn launch post",
    content:
      "We’re excited to introduce Novixa — an AI business OS that connects workflows, knowledge, and CRM in one place.\n\nIf your team is juggling tools, let’s talk.",
    prompt: "Announce product launch",
    tone: "professional",
    createdAt: new Date(now - 86400000).toISOString(),
  },
  {
    id: "ma-2",
    type: "email",
    title: "Nurture email — week 1",
    content:
      "Subject: One workspace for your ops stack\n\nHi {{first_name}},\n\nTeams waste hours switching between docs, tickets, and chat. Novixa brings them together with AI that understands your business context.\n\nReady for a 15-minute walkthrough?",
    prompt: "Write a nurture email",
    tone: "friendly",
    createdAt: new Date(now - 3600000 * 5).toISOString(),
  },
];

const demoCampaigns: MarketingCampaign[] = [
  {
    id: "mc-1",
    name: "Q3 Product Launch",
    status: "active",
    channel: "Multi-channel",
    startDate: new Date(now - 86400000 * 7).toISOString().slice(0, 10),
    endDate: new Date(now + 86400000 * 21).toISOString().slice(0, 10),
    createdAt: new Date(now - 86400000 * 10).toISOString(),
    updatedAt: new Date(now - 86400000).toISOString(),
  },
  {
    id: "mc-2",
    name: "Partner newsletter",
    status: "draft",
    channel: "Email",
    createdAt: new Date(now - 86400000 * 3).toISOString(),
    updatedAt: new Date(now - 86400000 * 2).toISOString(),
  },
];

function mapAssetType(value: unknown): MarketingAssetType {
  const type = String(value ?? "blog")
    .toLowerCase()
    .replace(/-/g, "_");
  return (type in ASSET_TYPE_LABELS ? type : "blog") as MarketingAssetType;
}

function mapTone(value: unknown): MarketingTone | undefined {
  const tone = String(value ?? "").toLowerCase();
  const allowed: MarketingTone[] = ["professional", "friendly", "bold", "playful", "urgent"];
  return allowed.includes(tone as MarketingTone) ? (tone as MarketingTone) : undefined;
}

function mapAsset(raw: Record<string, unknown>): MarketingAsset {
  return {
    id: String(raw.id),
    type: mapAssetType(raw.type),
    title: pickString(raw, "title", "name") || "Generated asset",
    content: pickString(raw, "content", "body", "text"),
    prompt: pickString(raw, "prompt") || undefined,
    tone: mapTone(raw.tone),
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

function mapCampaign(raw: Record<string, unknown>): MarketingCampaign {
  const statusRaw = pickString(raw, "status") || "draft";
  const status =
    statusRaw === "active" ||
    statusRaw === "paused" ||
    statusRaw === "completed" ||
    statusRaw === "draft"
      ? statusRaw
      : "draft";
  return {
    id: String(raw.id),
    name: pickString(raw, "name", "title") || "Campaign",
    status,
    channel: pickString(raw, "channel") || undefined,
    startDate:
      (raw.startDate as string | null | undefined) ??
      (raw.start_date as string | null | undefined) ??
      null,
    endDate:
      (raw.endDate as string | null | undefined) ??
      (raw.end_date as string | null | undefined) ??
      null,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

export async function fetchMarketingAssets(
  organizationId?: string | null,
): Promise<MarketingAsset[]> {
  if (isDemoMode()) return [...demoAssets];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.marketing.assets, organizationId));
    return unwrapList(payload).map(mapAsset);
  } catch {
    return [];
  }
}

export async function generateMarketingAsset(
  input: GenerateMarketingInput,
  organizationId?: string | null,
): Promise<MarketingAsset> {
  if (isDemoMode()) {
    const asset: MarketingAsset = {
      id: `ma-${Date.now()}`,
      type: input.type,
      title: `${ASSET_TYPE_LABELS[input.type]} draft`,
      content: `**【${ASSET_TYPE_LABELS[input.type]} · ${input.tone}】**\n\n${input.prompt}\n\nHere’s a polished draft tailored for your audience. Iterate tone or length as needed.`,
      prompt: input.prompt,
      tone: input.tone,
      createdAt: new Date().toISOString(),
    };
    demoAssets = [asset, ...demoAssets];
    return asset;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.marketing.generate, organizationId),
    {
      type: input.type,
      prompt: input.prompt,
      tone: input.tone,
      organization_id: organizationId,
    },
  );
  return mapAsset(payload);
}

export async function fetchCampaigns(organizationId?: string | null): Promise<MarketingCampaign[]> {
  if (isDemoMode()) return demoCampaigns;
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.marketing.campaigns, organizationId));
    return unwrapList(payload).map(mapCampaign);
  } catch {
    return [];
  }
}

function mapConnection(raw: Record<string, unknown>): SocialConnection {
  return {
    id: String(raw.id),
    platform: pickString(raw, "platform") || "facebook",
    accountName: pickString(raw, "account_name", "accountName") || "Account",
    accountId: pickString(raw, "account_id", "accountId") || undefined,
    status: pickString(raw, "status") || "connected",
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

function mapFacebookAd(raw: Record<string, unknown>): FacebookAd {
  const metrics =
    raw.metrics && typeof raw.metrics === "object" ? (raw.metrics as FacebookAd["metrics"]) : {};
  return {
    id: String(raw.id),
    name: pickString(raw, "name") || "Facebook Ad",
    captionPrompt: pickString(raw, "caption_prompt", "captionPrompt"),
    caption: pickString(raw, "caption"),
    status: pickString(raw, "status") || "draft",
    scheduledAt:
      (raw.scheduled_at as string | null | undefined) ??
      (raw.scheduledAt as string | null | undefined) ??
      null,
    automationEnabled: Boolean(raw.automation_enabled ?? raw.automationEnabled),
    targetAudience:
      (raw.target_audience as Record<string, unknown>) ||
      (raw.targetAudience as Record<string, unknown>) ||
      {},
    budgetCents: Number(raw.budget_cents ?? raw.budgetCents ?? 0),
    currency: pickString(raw, "currency") || "usd",
    metrics,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapSocialPost(raw: Record<string, unknown>): SocialPost {
  return {
    id: String(raw.id),
    content: pickString(raw, "content"),
    platforms: Array.isArray(raw.platforms) ? raw.platforms.map(String) : [],
    includeWhatsapp: Boolean(raw.include_whatsapp ?? raw.includeWhatsapp),
    status: pickString(raw, "status") || "draft",
    results: (raw.results as Record<string, unknown>) || {},
    publishedAt:
      (raw.published_at as string | null | undefined) ??
      (raw.publishedAt as string | null | undefined) ??
      null,
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

export async function fetchSocialConnections(
  organizationId?: string | null,
): Promise<SocialConnection[]> {
  if (isDemoMode()) return [];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.marketing.socialConnections, organizationId));
    return unwrapList(payload).map(mapConnection);
  } catch {
    return [];
  }
}

export async function connectSocialAccount(
  input: ConnectSocialInput,
  organizationId?: string | null,
): Promise<SocialConnection> {
  if (!organizationId) throw new Error("organization_id is required");
  if (isDemoMode()) {
    return {
      id: `sc-${Date.now()}`,
      platform: input.platform,
      accountName: input.accountName,
      accountId: input.accountId,
      status: "connected",
      createdAt: new Date().toISOString(),
    };
  }
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.marketing.socialConnections, {
    organization_id: organizationId,
    platform: input.platform,
    account_name: input.accountName,
    account_id: input.accountId ?? "",
    access_token: input.accessToken ?? "stub-token",
  });
  return mapConnection(raw);
}

export async function disconnectSocialAccount(
  connectionId: string,
  _organizationId?: string | null,
): Promise<void> {
  if (isDemoMode()) return;
  await api.delete(API_ENDPOINTS.marketing.socialConnection(connectionId));
}

export async function fetchFacebookAds(organizationId?: string | null): Promise<FacebookAd[]> {
  if (isDemoMode()) return [];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.marketing.facebookAds, organizationId));
    return unwrapList(payload).map(mapFacebookAd);
  } catch {
    return [];
  }
}

export async function createFacebookAd(
  input: CreateFacebookAdInput,
  organizationId?: string | null,
): Promise<FacebookAd> {
  if (!organizationId) throw new Error("organization_id is required");
  if (isDemoMode()) {
    return {
      id: `fb-${Date.now()}`,
      name: input.name,
      captionPrompt: input.captionPrompt,
      caption: `Ad caption for: ${input.captionPrompt}`,
      status: input.status || "draft",
      scheduledAt: input.scheduledAt ?? null,
      automationEnabled: Boolean(input.automationEnabled),
      targetAudience: { note: input.targetAudience || "" },
      budgetCents: input.budgetCents || 0,
      currency: "usd",
      metrics: { reach: 0, leads: 0, progress: 0, performance: "pending" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.marketing.facebookAds, {
    organization_id: organizationId,
    name: input.name,
    caption_prompt: input.captionPrompt,
    target_audience: { note: input.targetAudience || "" },
    budget_cents: input.budgetCents || 0,
    automation_enabled: Boolean(input.automationEnabled),
    scheduled_at: input.scheduledAt || null,
    status: input.status || "draft",
  });
  return mapFacebookAd(raw);
}

export async function refreshFacebookAdMetrics(
  adId: string,
  _organizationId?: string | null,
): Promise<FacebookAd> {
  if (isDemoMode()) {
    return {
      id: adId,
      name: "Demo Ad",
      captionPrompt: "",
      caption: "",
      status: "active",
      automationEnabled: true,
      targetAudience: {},
      budgetCents: 0,
      currency: "usd",
      metrics: { reach: 120, leads: 4, progress: 35, performance: "live" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  const raw = await api.post<Record<string, unknown>>(
    API_ENDPOINTS.marketing.facebookAdMetrics(adId),
    {},
  );
  return mapFacebookAd(raw);
}

export async function fetchSocialPosts(organizationId?: string | null): Promise<SocialPost[]> {
  if (isDemoMode()) return [];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.marketing.socialPosts, organizationId));
    return unwrapList(payload).map(mapSocialPost);
  } catch {
    return [];
  }
}

export async function publishSocialPost(
  input: PublishSocialPostInput,
  organizationId?: string | null,
): Promise<SocialPost> {
  if (!organizationId) throw new Error("organization_id is required");
  if (isDemoMode()) {
    return {
      id: `sp-${Date.now()}`,
      content: input.content,
      platforms: input.platforms,
      includeWhatsapp: Boolean(input.includeWhatsapp),
      status: "published",
      results: Object.fromEntries(input.platforms.map((p) => [p, { ok: true }])),
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }
  const raw = await api.post<Record<string, unknown>>(API_ENDPOINTS.marketing.socialPosts, {
    organization_id: organizationId,
    content: input.content,
    platforms: input.platforms,
    include_whatsapp: Boolean(input.includeWhatsapp),
  });
  return mapSocialPost(raw);
}
