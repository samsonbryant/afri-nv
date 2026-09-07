"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Megaphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCampaigns,
  useConnectSocial,
  useCreateFacebookAd,
  useDisconnectSocial,
  useFacebookAds,
  useGenerateMarketingAsset,
  useMarketingAssets,
  usePublishSocialPost,
  useRefreshFacebookAd,
  useSocialConnections,
  useSocialPosts,
} from "@/features/marketing/hooks/use-marketing";
import { useMarketingStore } from "@/features/marketing/stores/marketing-store";
import {
  ASSET_TYPE_LABELS,
  SOCIAL_PLATFORMS,
  TONE_LABELS,
  type MarketingAssetType,
  type MarketingTone,
  type SocialPlatform,
} from "@/features/marketing/types";
import { formatRelative } from "@/lib/utils/format";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function GeneratorForm() {
  const type = useMarketingStore((s) => s.type);
  const prompt = useMarketingStore((s) => s.prompt);
  const tone = useMarketingStore((s) => s.tone);
  const setType = useMarketingStore((s) => s.setType);
  const setPrompt = useMarketingStore((s) => s.setPrompt);
  const setTone = useMarketingStore((s) => s.setTone);
  const generate = useGenerateMarketingAsset();

  return (
    <form
      className="border-border bg-card space-y-4 rounded-xl border p-4 md:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!prompt.trim()) return;
        generate.mutate({ type, prompt: prompt.trim(), tone });
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="asset-type">Type</Label>
          <Select
            id="asset-type"
            value={type}
            onChange={(e) => setType(e.target.value as MarketingAssetType)}
          >
            {(Object.keys(ASSET_TYPE_LABELS) as MarketingAssetType[]).map((key) => (
              <option key={key} value={key}>
                {ASSET_TYPE_LABELS[key]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="asset-tone">Tone</Label>
          <Select
            id="asset-tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as MarketingTone)}
          >
            {(Object.keys(TONE_LABELS) as MarketingTone[]).map((key) => (
              <option key={key} value={key}>
                {TONE_LABELS[key]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="asset-prompt">Prompt</Label>
        <Textarea
          id="asset-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the audience, offer, and goal…"
          className="min-h-[120px]"
          required
        />
      </div>
      <Button type="submit" disabled={generate.isPending || !prompt.trim()}>
        {generate.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Generate
      </Button>
    </form>
  );
}

function AssetGallery() {
  const { data = [], isLoading, isError, refetch } = useMarketingAssets();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Couldn’t load assets"
        description="Try again shortly."
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No generated content yet"
        description="Use the generator to create your first asset."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((asset) => (
        <li key={asset.id} className="border-border bg-card rounded-xl border p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-foreground font-medium">{asset.title}</h3>
              <Badge variant="secondary">{ASSET_TYPE_LABELS[asset.type]}</Badge>
              {asset.tone ? <Badge variant="outline">{TONE_LABELS[asset.tone]}</Badge> : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {formatRelative(asset.createdAt)}
              </span>
              <CopyButton text={asset.content} />
            </div>
          </div>
          <pre className="bg-muted/40 text-foreground whitespace-pre-wrap rounded-lg p-3 text-sm leading-relaxed">
            {asset.content}
          </pre>
        </li>
      ))}
    </ul>
  );
}

function CampaignsList() {
  const { data = [], isLoading, isError, refetch } = useCampaigns();

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (isError) {
    return (
      <EmptyState
        icon={Megaphone}
        title="Couldn’t load campaigns"
        description="Try again shortly."
        actionLabel="Retry"
        onAction={() => void refetch()}
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No campaigns"
        description="Campaigns will appear here once created."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((campaign) => (
        <li
          key={campaign.id}
          className="border-border bg-card flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{campaign.name}</h3>
              <Badge
                variant={
                  campaign.status === "active"
                    ? "success"
                    : campaign.status === "paused"
                      ? "warning"
                      : "secondary"
                }
              >
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              {campaign.channel ?? "Channel TBD"}
              {campaign.startDate ? ` · ${campaign.startDate}` : ""}
              {campaign.endDate ? ` → ${campaign.endDate}` : ""}
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Updated {formatRelative(campaign.updatedAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function SocialConnectionsPanel() {
  const { data = [], isLoading } = useSocialConnections();
  const connect = useConnectSocial();
  const disconnect = useDisconnectSocial();
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [accountName, setAccountName] = useState("");
  const [accessToken, setAccessToken] = useState("");

  return (
    <div className="space-y-4">
      <form
        className="border-border bg-card space-y-3 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!accountName.trim()) return;
          connect.mutate(
            {
              platform,
              accountName: accountName.trim(),
              accessToken: accessToken.trim() || undefined,
            },
            {
              onSuccess: () => {
                setAccountName("");
                setAccessToken("");
              },
            },
          );
        }}
      >
        <p className="text-muted-foreground text-sm">
          Connect Facebook, Instagram, WhatsApp and other channels. Paste a Meta Graph / WhatsApp
          Cloud token for live verify; without a token we still mark the channel connected in
          realtime for local workflows.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="social-platform">Platform</Label>
            <Select
              id="social-platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
            >
              {SOCIAL_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="social-account">Account / page name</Label>
            <Input
              id="social-account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. Novixa HQ"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="social-token">Access token (optional)</Label>
            <Input
              id="social-token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Meta Graph or WhatsApp Cloud token"
              autoComplete="off"
            />
          </div>
        </div>
        <Button type="submit" disabled={connect.isPending || !accountName.trim()}>
          {connect.isPending ? "Connecting…" : "Connect & verify"}
        </Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No social accounts connected"
          description="Connect Facebook, Instagram, LinkedIn, WhatsApp, and more."
        />
      ) : (
        <ul className="space-y-2">
          {data.map((conn) => (
            <li
              key={conn.id}
              className="border-border bg-card flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
            >
              <div>
                <p className="font-medium">{conn.accountName}</p>
                <p className="text-muted-foreground text-xs">
                  {conn.platform} · {conn.status}
                  {conn.status === "connected" ? " · verified realtime" : ""}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => disconnect.mutate(conn.id)}
              >
                Disconnect
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FacebookAdsPanel() {
  const { data = [], isLoading } = useFacebookAds();
  const createAd = useCreateFacebookAd();
  const refresh = useRefreshFacebookAd();
  const [name, setName] = useState("");
  const [captionPrompt, setCaptionPrompt] = useState("");
  const [target, setTarget] = useState("");
  const [automation, setAutomation] = useState(true);

  return (
    <div className="space-y-4">
      <form
        className="border-border bg-card space-y-3 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!captionPrompt.trim()) return;
          createAd.mutate(
            {
              name: name.trim() || "Facebook Ad",
              captionPrompt: captionPrompt.trim(),
              targetAudience: target.trim(),
              automationEnabled: automation,
              status: "scheduled",
            },
            {
              onSuccess: () => {
                setName("");
                setCaptionPrompt("");
                setTarget("");
              },
            },
          );
        }}
      >
        <p className="text-muted-foreground text-sm">
          Create caption prompts, schedule ads, automate leads, and track reach, target, and
          progress in realtime.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ad-name">Ad name</Label>
            <Input id="ad-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ad-target">Target audience</Label>
            <Input
              id="ad-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="SMBs in West Africa, 25–45"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ad-prompt">Caption prompt</Label>
          <Textarea
            id="ad-prompt"
            value={captionPrompt}
            onChange={(e) => setCaptionPrompt(e.target.value)}
            placeholder="Promote our 15-day unlimited trial…"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={automation}
            onChange={(e) => setAutomation(e.target.checked)}
          />
          Enable automation & lead capture
        </label>
        <Button type="submit" disabled={createAd.isPending || !captionPrompt.trim()}>
          {createAd.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create Facebook ad
        </Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Facebook ads yet"
          description="Create an ad with a caption prompt to get started."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((ad) => (
            <li key={ad.id} className="border-border bg-card space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{ad.name}</h3>
                  <Badge variant="secondary">{ad.status}</Badge>
                  {ad.automationEnabled ? <Badge variant="outline">Automation</Badge> : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => refresh.mutate(ad.id)}
                >
                  Refresh metrics
                </Button>
              </div>
              <pre className="bg-muted/40 whitespace-pre-wrap rounded-lg p-3 text-sm">
                {ad.caption}
              </pre>
              <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                <span>Reach: {ad.metrics.reach ?? 0}</span>
                <span>Leads: {ad.metrics.leads ?? 0}</span>
                <span>Clicks: {ad.metrics.clicks ?? 0}</span>
                <span>Progress: {ad.metrics.progress ?? 0}%</span>
                <span>Perf: {ad.metrics.performance ?? "—"}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PublishPanel() {
  const { data = [], isLoading } = useSocialPosts();
  const publish = usePublishSocialPost();
  const [content, setContent] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "instagram", "whatsapp"]);
  const [includeWhatsapp, setIncludeWhatsapp] = useState(true);

  function togglePlatform(id: string) {
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-4">
      <form
        className="border-border bg-card space-y-3 rounded-xl border p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!content.trim() || platforms.length === 0) return;
          publish.mutate(
            {
              content: content.trim(),
              platforms,
              includeWhatsapp,
            },
            { onSuccess: () => setContent("") },
          );
        }}
      >
        <p className="text-muted-foreground text-sm">
          Share content across connected pages and WhatsApp simultaneously in realtime.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="post-content">Content</Label>
          <Textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
            required
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={platforms.includes(p.id) ? "default" : "outline"}
              onClick={() => togglePlatform(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeWhatsapp}
            onChange={(e) => setIncludeWhatsapp(e.target.checked)}
          />
          Also push to WhatsApp Business
        </label>
        <Button type="submit" disabled={publish.isPending || !content.trim()}>
          {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Publish now
        </Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No posts yet"
          description="Publish once to see realtime delivery results."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((post) => (
            <li key={post.id} className="border-border bg-card rounded-xl border p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{post.status}</Badge>
                <span className="text-muted-foreground text-xs">
                  {post.platforms.join(", ")}
                  {post.publishedAt ? ` · ${formatRelative(post.publishedAt)}` : ""}
                </span>
              </div>
              <pre className="whitespace-pre-wrap text-sm">{post.content}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MarketingStudio() {
  return (
    <div>
      <PageHeader
        title="Marketing Studio"
        description="Connect social pages, run Facebook ads, publish everywhere including WhatsApp, and generate channel-ready copy — end to end in realtime."
      />
      <Tabs defaultValue="social">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="social">Social connect</TabsTrigger>
          <TabsTrigger value="facebook">Facebook ads</TabsTrigger>
          <TabsTrigger value="publish">Publish</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        <TabsContent value="social" className="space-y-6">
          <SocialConnectionsPanel />
        </TabsContent>
        <TabsContent value="facebook" className="space-y-6">
          <FacebookAdsPanel />
        </TabsContent>
        <TabsContent value="publish" className="space-y-6">
          <PublishPanel />
        </TabsContent>
        <TabsContent value="generate" className="space-y-6">
          <GeneratorForm />
          <AssetGallery />
        </TabsContent>
        <TabsContent value="assets">
          <AssetGallery />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
