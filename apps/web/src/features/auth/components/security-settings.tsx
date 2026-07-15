"use client";

import { useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  useConfirmTwoFactor,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useRevokeSession,
  useSessions,
  useTwoFactorStatus,
} from "@/features/auth/hooks/use-auth";
import { formatRelative } from "@/lib/utils/format";

export function SecuritySettings() {
  const { data: twoFactor, isLoading: twoFactorLoading } = useTwoFactorStatus();
  const { data: sessions, isLoading: sessionsLoading } = useSessions();
  const enable2fa = useEnableTwoFactor();
  const confirm2fa = useConfirmTwoFactor();
  const disable2fa = useDisableTwoFactor();
  const revoke = useRevokeSession();
  const [confirmCode, setConfirmCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);

  const enabled = twoFactor?.enabled ?? false;
  const setupPending = Boolean(enable2fa.data?.otpauthUrl) && !enabled;

  return (
    <section className="border-border bg-card space-y-4 rounded-xl border p-6">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
          <Shield className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold">Security</h2>
          <p className="text-muted-foreground text-sm">
            Manage two-factor authentication and active sessions.
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="two-factor">Two-factor authentication</Label>
          <p className="text-muted-foreground text-sm">Require a one-time code when signing in.</p>
        </div>
        {twoFactorLoading ? (
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
        ) : (
          <Switch
            id="two-factor"
            checked={enabled}
            disabled={enable2fa.isPending || confirm2fa.isPending || disable2fa.isPending}
            onCheckedChange={(checked) => {
              if (checked) {
                enable2fa.mutate();
                setShowDisableForm(false);
              } else {
                setShowDisableForm(true);
              }
            }}
            aria-label="Toggle two-factor authentication"
          />
        )}
      </div>

      {setupPending ? (
        <div className="border-border bg-muted/40 space-y-3 rounded-md border p-3">
          <p className="text-muted-foreground break-all text-xs">
            Setup URL: {enable2fa.data?.otpauthUrl}
          </p>
          {enable2fa.data?.secret ? (
            <p className="text-muted-foreground text-xs">Secret: {enable2fa.data.secret}</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={confirmCode}
              onChange={(event) => setConfirmCode(event.target.value)}
              placeholder="Enter 6-digit code"
              inputMode="numeric"
              aria-label="Two-factor confirmation code"
            />
            <Button
              type="button"
              disabled={confirm2fa.isPending || confirmCode.trim().length < 6}
              onClick={() =>
                confirm2fa.mutate(confirmCode.trim(), {
                  onSuccess: () => setConfirmCode(""),
                })
              }
            >
              Confirm 2FA
            </Button>
          </div>
        </div>
      ) : null}

      {showDisableForm && enabled ? (
        <div className="border-border bg-muted/40 space-y-3 rounded-md border p-3">
          <p className="text-muted-foreground text-sm">
            Enter your password and a current 2FA code to disable.
          </p>
          <Input
            type="password"
            value={disablePassword}
            onChange={(event) => setDisablePassword(event.target.value)}
            placeholder="Password"
            aria-label="Password to disable 2FA"
          />
          <Input
            value={disableCode}
            onChange={(event) => setDisableCode(event.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            aria-label="Code to disable 2FA"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={disable2fa.isPending || !disablePassword || disableCode.trim().length < 6}
              onClick={() =>
                disable2fa.mutate(
                  {
                    password: disablePassword,
                    code: disableCode.trim(),
                  },
                  {
                    onSuccess: () => {
                      setShowDisableForm(false);
                      setDisablePassword("");
                      setDisableCode("");
                    },
                  },
                )
              }
            >
              Disable 2FA
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowDisableForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Active sessions</h3>
        {sessionsLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading sessions…
          </div>
        ) : sessions && sessions.length > 0 ? (
          <ul className="space-y-2">
            {sessions.map((session, index) => (
              <li
                key={session.id || session.jti || `session-${index}`}
                className="border-border flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {session.device ?? "Unknown device"}
                    {session.current ? " (this device)" : ""}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Active {formatRelative(session.lastActiveAt)}
                    {session.ipAddress ? ` · ${session.ipAddress}` : ""}
                  </p>
                </div>
                {!session.current ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(session.jti ?? session.id)}
                  >
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">No sessions found.</p>
        )}
      </div>
    </section>
  );
}
