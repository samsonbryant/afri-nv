export type MarketingAssetType =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "blog"
  | "seo"
  | "email"
  | "landing_page"
  | "product_description"
  | "ads";

export type MarketingTone = "professional" | "friendly" | "bold" | "playful" | "urgent";

export type MarketingAsset = {
  id: string;
  type: MarketingAssetType;
  title: string;
  content: string;
  prompt?: string;
  tone?: MarketingTone;
  createdAt: string;
};

export type MarketingCampaign = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused" | "completed";
  channel?: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GenerateMarketingInput = {
  type: MarketingAssetType;
  prompt: string;
  tone: MarketingTone;
};

export type SocialPlatform =
  "facebook" | "instagram" | "linkedin" | "twitter" | "tiktok" | "youtube" | "whatsapp";

export type SocialConnection = {
  id: string;
  platform: SocialPlatform | string;
  accountName: string;
  accountId?: string;
  status: string;
  createdAt: string;
};

export type FacebookAd = {
  id: string;
  name: string;
  captionPrompt: string;
  caption: string;
  status: string;
  scheduledAt?: string | null;
  automationEnabled: boolean;
  targetAudience: Record<string, unknown>;
  budgetCents: number;
  currency: string;
  metrics: {
    reach?: number;
    leads?: number;
    impressions?: number;
    clicks?: number;
    progress?: number;
    performance?: string;
    updated_at?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type SocialPost = {
  id: string;
  content: string;
  platforms: string[];
  includeWhatsapp: boolean;
  status: string;
  results: Record<string, unknown>;
  publishedAt?: string | null;
  createdAt: string;
};

export type ConnectSocialInput = {
  platform: SocialPlatform | string;
  accountName: string;
  accountId?: string;
  accessToken?: string;
};

export type CreateFacebookAdInput = {
  name: string;
  captionPrompt: string;
  targetAudience?: string;
  budgetCents?: number;
  automationEnabled?: boolean;
  scheduledAt?: string;
  status?: string;
};

export type PublishSocialPostInput = {
  content: string;
  platforms: string[];
  includeWhatsapp?: boolean;
};

export const ASSET_TYPE_LABELS: Record<MarketingAssetType, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter / X",
  blog: "Blog",
  seo: "SEO",
  email: "Email",
  landing_page: "Landing Page",
  product_description: "Product Description",
  ads: "Ads",
};

export const TONE_LABELS: Record<MarketingTone, string> = {
  professional: "Professional",
  friendly: "Friendly",
  bold: "Bold",
  playful: "Playful",
  urgent: "Urgent",
};

export const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X / Twitter" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "whatsapp", label: "WhatsApp Business" },
];
