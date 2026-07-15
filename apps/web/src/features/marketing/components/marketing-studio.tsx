"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Megaphone, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCampaigns,
  useGenerateMarketingAsset,
  useMarketingAssets,
} from "@/features/marketing/hooks/use-marketing";
import { useMarketingStore } from "@/features/marketing/stores/marketing-store";
import {
  ASSET_TYPE_LABELS,
  TONE_LABELS,
  type MarketingAssetType,
  type MarketingTone,
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

export function MarketingStudio() {
  return (
    <div>
      <PageHeader
        title="Marketing Studio"
        description="Generate channel-ready copy and review campaigns."
      />
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
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
