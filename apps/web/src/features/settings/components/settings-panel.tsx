"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  changePasswordRequest,
  updateProfileRequest,
  uploadAvatarRequest,
} from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useSettingsStore } from "@/features/settings/stores/settings-store";
import { useMounted } from "@/hooks/use-mounted";
import { getErrorMessage } from "@/lib/api/errors";

export function SettingsPanel() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const organization = useAuthStore((state) => state.organization);
  const { preferences, setPreferences } = useSettingsStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? user.fullName.split(" ")[0] ?? "");
    setLastName(user.lastName ?? user.fullName.split(" ").slice(1).join(" "));
  }, [user]);

  const initials =
    user?.fullName
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your profile, password, appearance, and notifications."
      />

      <div className="mx-auto max-w-2xl space-y-8">
        <section className="border-border bg-card space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Profile</h2>
            <p className="text-muted-foreground text-sm">
              Update your name and profile photo. Email is managed by your account login.
            </p>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-16 w-16">
              {user?.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.fullName} /> : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploadingAvatar(true);
                  try {
                    const updated = await uploadAvatarRequest(file);
                    setUser(updated);
                    toast.success("Profile photo updated");
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  } finally {
                    setUploadingAvatar(false);
                    event.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => fileRef.current?.click()}
              >
                {uploadingAvatar ? "Uploading…" : "Upload photo"}
              </Button>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-xs uppercase tracking-wide">Organization</p>
              <p className="mt-1 text-sm font-medium">{organization?.name ?? "—"}</p>
            </div>
          </div>
          <Button
            type="button"
            disabled={savingProfile}
            onClick={async () => {
              setSavingProfile(true);
              try {
                const updated = await updateProfileRequest({ firstName, lastName });
                setUser(updated);
                toast.success("Profile saved");
              } catch (error) {
                toast.error(getErrorMessage(error));
              } finally {
                setSavingProfile(false);
              }
            }}
          >
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
        </section>

        <section className="border-border bg-card space-y-4 rounded-xl border p-6">
          <div>
            <h2 className="font-display text-lg font-semibold">Password</h2>
            <p className="text-muted-foreground text-sm">
              Change the password for this account. Admins can also reset other users from Admin.
            </p>
          </div>
          <Separator />
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button
            type="button"
            disabled={
              savingPassword ||
              !currentPassword ||
              newPassword.length < 8 ||
              newPassword !== confirmPassword
            }
            onClick={async () => {
              if (newPassword !== confirmPassword) {
                toast.error("New passwords do not match");
                return;
              }
              setSavingPassword(true);
              try {
                await changePasswordRequest({
                  currentPassword,
                  newPassword,
                });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                toast.success("Password updated");
              } catch (error) {
                toast.error(getErrorMessage(error));
              } finally {
                setSavingPassword(false);
              }
            }}
          >
            {savingPassword ? "Updating…" : "Update password"}
          </Button>
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
