import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { isDemoMode } from "@/lib/constants";
import type {
  GenerateMarketingInput,
  MarketingAsset,
  MarketingAssetType,
  MarketingCampaign,
  MarketingTone,
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
