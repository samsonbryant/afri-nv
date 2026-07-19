"use client";

import { useState } from "react";
import { Code2, Copy, ExternalLink, KeyRound, Loader2, Plus, Trash2, Webhook } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import {
  useApiKeys,
  useCreateApiKey,
  useCreateWebhook,
  useDeleteWebhook,
  useRevokeApiKey,
  useWebhooks,
} from "@/features/developer/hooks/use-developer";
import { useDeveloperStore } from "@/features/developer/stores/developer-store";
import { API_URL, APP_URL } from "@/lib/constants";
import { formatRelative } from "@/lib/utils/format";
import { toast } from "sonner";

const DOCS_URL = API_URL.replace(/\/api\/v1\/?$/, "") + "/api/docs/";
const GRAPHQL_URL = API_URL.replace(/\/api\/v1\/?$/, "") + "/graphql/";

const SDK_SNIPPET = `import { Novixa } from "@novixa/sdk";

const client = new Novixa({
  apiKey: process.env.NOVIXA_API_KEY!,
  baseUrl: "${API_URL}",
});

const result = await client.agents.run("sales", {
  prompt: "Summarize this week's pipeline",
});

console.log(result.response);`;

export function DeveloperConsole() {
  const keyDialogOpen = useDeveloperStore((s) => s.keyDialogOpen);
  const setKeyDialogOpen = useDeveloperStore((s) => s.setKeyDialogOpen);
  const webhookDialogOpen = useDeveloperStore((s) => s.webhookDialogOpen);
  const setWebhookDialogOpen = useDeveloperStore((s) => s.setWebhookDialogOpen);
  const lastCreatedSecret = useDeveloperStore((s) => s.lastCreatedSecret);
  const setLastCreatedSecret = useDeveloperStore((s) => s.setLastCreatedSecret);

  const [keyName, setKeyName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState("workflow.completed, agent.run.finished");

  const { data: keys = [], isLoading: loadingKeys } = useApiKeys();
  const { data: webhooks = [], isLoading: loadingWebhooks } = useWebhooks();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const createWebhook = useCreateWebhook();
  const deleteWebhook = useDeleteWebhook();

  function copy(text: string, label = "Copied") {
    void navigator.clipboard.writeText(text);
    toast.success(label);
  }

  async function handleCreateKey() {
    if (!keyName.trim()) return;
    await createKey.mutateAsync({ name: keyName.trim() });
    setKeyName("");
  }

  async function handleCreateWebhook() {
    if (!webhookUrl.trim()) return;
    const events = webhookEvents
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    await createWebhook.mutateAsync({ url: webhookUrl.trim(), events });
    setWebhookUrl("");
    setWebhookDialogOpen(false);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Developer"
        description="API keys, webhooks, and docs for integrating with Novixa."
      />

      <section className="grid gap-3 sm:grid-cols-2">
        <a
          href={DOCS_URL}
          target="_blank"
          rel="noreferrer"
          className="border-border bg-card hover:bg-accent/40 flex items-center justify-between rounded-xl border p-4 transition-colors"
        >
          <div>
            <p className="font-medium">OpenAPI docs</p>
            <p className="text-muted-foreground text-sm">{DOCS_URL}</p>
          </div>
          <ExternalLink className="text-muted-foreground h-4 w-4" />
        </a>
        <a
          href={GRAPHQL_URL}
          target="_blank"
          rel="noreferrer"
          className="border-border bg-card hover:bg-accent/40 flex items-center justify-between rounded-xl border p-4 transition-colors"
        >
          <div>
            <p className="font-medium">GraphQL</p>
            <p className="text-muted-foreground text-sm">{GRAPHQL_URL}</p>
          </div>
          <ExternalLink className="text-muted-foreground h-4 w-4" />
        </a>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            API keys
          </h2>
          <Button size="sm" onClick={() => setKeyDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Create key
          </Button>
        </div>
        {loadingKeys ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : keys.length === 0 ? (
          <EmptyState
            icon={KeyRound}
            title="No API keys"
            description="Create a key to authenticate SDK and REST calls."
            actionLabel="Create key"
            onAction={() => setKeyDialogOpen(true)}
          />
        ) : (
          <div className="border-border rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs">{key.prefix}…</code>
                    </TableCell>
                    <TableCell>{formatRelative(key.createdAt)}</TableCell>
                    <TableCell>
                      {key.lastUsedAt ? formatRelative(key.lastUsedAt) : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revokeKey.isPending}
                        onClick={() => revokeKey.mutate(key.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            Webhooks
          </h2>
          <Button size="sm" variant="outline" onClick={() => setWebhookDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add endpoint
          </Button>
        </div>
        {loadingWebhooks ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhooks"
            description="Receive workflow and agent events at your endpoint."
            actionLabel="Add endpoint"
            onAction={() => setWebhookDialogOpen(true)}
          />
        ) : (
          <ul className="space-y-3">
            {webhooks.map((hook) => (
              <li
                key={hook.id}
                className="border-border bg-card flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{hook.url}</p>
                    <Badge variant={hook.active ? "success" : "outline"}>
                      {hook.active ? "active" : "inactive"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {hook.events.join(", ") || "No events"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={deleteWebhook.isPending}
                  onClick={() => deleteWebhook.mutate(hook.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
            SDK usage
          </h2>
          <Button variant="outline" size="sm" onClick={() => copy(SDK_SNIPPET, "Snippet copied")}>
            <Copy className="h-4 w-4" aria-hidden />
            Copy
          </Button>
        </div>
        <pre className="border-border overflow-x-auto rounded-xl border bg-slate-950 p-4 text-xs text-slate-100">
          <code>{SDK_SNIPPET}</code>
        </pre>
        <p className="text-muted-foreground text-xs">
          App URL: {APP_URL} · API: {API_URL}
        </p>
      </section>

      <Dialog
        open={keyDialogOpen}
        onOpenChange={(open) => {
          setKeyDialogOpen(open);
          if (!open) setLastCreatedSecret(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API key</DialogTitle>
            <DialogDescription>
              {lastCreatedSecret
                ? "Copy this secret now — it will not be shown again."
                : "Name this key so you can recognize it later."}
            </DialogDescription>
          </DialogHeader>
          {lastCreatedSecret ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={lastCreatedSecret} />
                <Button variant="outline" onClick={() => copy(lastCreatedSecret, "Secret copied")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Production"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>
              {lastCreatedSecret ? "Done" : "Cancel"}
            </Button>
            {!lastCreatedSecret ? (
              <Button
                onClick={() => void handleCreateKey()}
                disabled={createKey.isPending || !keyName.trim()}
              >
                {createKey.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Code2 className="h-4 w-4" aria-hidden />
                )}
                Create
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add webhook endpoint</DialogTitle>
            <DialogDescription>
              Novixa will POST event payloads to this HTTPS URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wh-url">URL</Label>
              <Input
                id="wh-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://example.com/hooks/novixa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-events">Events (comma-separated)</Label>
              <Input
                id="wh-events"
                value={webhookEvents}
                onChange={(e) => setWebhookEvents(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreateWebhook()}
              disabled={createWebhook.isPending || !webhookUrl.trim()}
            >
              {createWebhook.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
