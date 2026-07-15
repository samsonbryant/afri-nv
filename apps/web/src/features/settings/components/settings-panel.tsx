"use client";

import { useTheme } from "next-themes";
import { PageHeader } from "@/components/shared/page-header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useSettingsStore } from "@/features/settings/stores/settings-store";
import { useMounted } from "@/hooks/use-mounted";
import { toast } from "sonner";

export function SettingsPanel() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const { preferences, setPreferences } = useSettingsStore();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage appearance, notifications, and account preferences."
      />

      <div className="mx-auto max-w-2xl space-y-8">
        <section className="border-border bg-card space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Profile</h2>
            <p className="text-muted-foreground text-sm">
              Your account details for this workspace.
            </p>
          </div>
          <Separator />
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Name</dt>
              <dd className="mt-1 text-sm font-medium">{user?.fullName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">Email</dt>
              <dd className="mt-1 text-sm font-medium">{user?.email ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                Organization
              </dt>
              <dd className="mt-1 text-sm font-medium">{organization?.name ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="border-border bg-card space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Appearance</h2>
            <p className="text-muted-foreground text-sm">Choose how Novixa looks on this device.</p>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
            {(["light", "dark", "system"] as const).map((value) => (
              <Button
                key={value}
                type="button"
                variant={mounted && theme === value ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTheme(value);
                  setPreferences({ theme: value });
                  toast.success(`Theme set to ${value === "system" ? "system" : value}`);
                }}
                aria-pressed={mounted && theme === value}
              >
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </Button>
            ))}
          </div>
        </section>

        <section className="border-border bg-card space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Notifications</h2>
            <p className="text-muted-foreground text-sm">Control email updates from Novixa.</p>
          </div>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email notifications</Label>
                <p className="text-muted-foreground text-sm">
                  Alerts for failed runs and approval requests.
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => setPreferences({ emailNotifications: checked })}
                aria-label="Toggle email notifications"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly digest</Label>
                <p className="text-muted-foreground text-sm">
                  A summary of workflow and automation activity.
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={preferences.weeklyDigest}
                onCheckedChange={(checked) => setPreferences({ weeklyDigest: checked })}
                aria-label="Toggle weekly digest"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
