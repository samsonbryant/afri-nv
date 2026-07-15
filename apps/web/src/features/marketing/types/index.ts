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
