"use client";

import { useState } from "react";
import { Calendar, Copy, Link2, Plus } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useBookingLinks,
  useCalendarConnections,
  useConnectCalendar,
  useCreateBookingLink,
  useCreateMeeting,
  useMeetings,
  useReminderSettings,
  useUpdateReminders,
} from "@/features/meetings/hooks/use-meetings";
import { useMeetingsStore } from "@/features/meetings/stores/meetings-store";
import type { MeetingProvider } from "@/features/meetings/types";
import { toast } from "sonner";

const PROVIDER_LABELS: Record<MeetingProvider, string> = {
  zoom: "Zoom",
  meet: "Google Meet",
  teams: "Microsoft Teams",
};

export function MeetingsWorkspace() {
  const { data: meetings = [], isLoading, isError, refetch } = useMeetings();
  const { data: connections = [] } = useCalendarConnections();
  const { data: bookingLinks = [] } = useBookingLinks();
  const { data: reminders } = useReminderSettings();
  const createMeeting = useCreateMeeting();
  const connectCalendar = useConnectCalendar();
  const createBookingLink = useCreateBookingLink();
  const updateReminders = useUpdateReminders();
  const { createOpen, setCreateOpen } = useMeetingsStore();

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [provider, setProvider] = useState<MeetingProvider>("zoom");
  const [linkTitle, setLinkTitle] = useState("");
  const [duration, setDuration] = useState(30);

  const upcoming = meetings
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Schedule meetings, connect calendars, and share booking links."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New meeting
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Upcoming</h2>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : null}
          {isError ? (
            <EmptyState
              icon={Calendar}
              title="Couldn’t load meetings"
              description="Check your connection and try again."
              actionLabel="Retry"
              onAction={() => void refetch()}
            />
          ) : null}
          {!isLoading && !isError && upcoming.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No upcoming meetings"
              description="Schedule a meeting or share a booking link."
              actionLabel="New meeting"
              onAction={() => setCreateOpen(true)}
            />
          ) : null}
          {!isLoading && upcoming.length > 0 ? (
            <ul className="space-y-3">
              {upcoming.map((meeting) => (
                <li
                  key={meeting.id}
                  className="border-border bg-card flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{meeting.title}</h3>
                      <Badge variant="secondary">{PROVIDER_LABELS[meeting.provider]}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {format(new Date(meeting.startsAt), "PPp")}
                    </p>
                  </div>
                  {meeting.joinUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={meeting.joinUrl} target="_blank" rel="noreferrer">
                        Join
                      </a>
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <div className="space-y-8">
          <section className="border-border bg-card space-y-4 rounded-xl border p-5">
            <h2 className="font-display text-lg font-semibold">Calendar connections</h2>
            <div className="space-y-3">
              {(["google", "microsoft"] as const).map((providerKey) => {
                const conn = connections.find((c) => c.provider === providerKey);
                const label = providerKey === "google" ? "Google Calendar" : "Microsoft 365";
                return (
                  <div key={providerKey} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-muted-foreground text-xs">
                        {conn?.connected ? (conn.email ?? "Connected") : "Not connected"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={conn?.connected ? "secondary" : "outline"}
                      disabled={connectCalendar.isPending || conn?.connected}
                      onClick={() => connectCalendar.mutate(providerKey)}
                    >
                      {conn?.connected ? "Connected" : "Connect"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border-border bg-card space-y-4 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Booking links</h2>
              <Link2 className="text-muted-foreground h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="link-title">Title</Label>
                <Input
                  id="link-title"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="30-min intro"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 30)}
                />
              </div>
              <Button
                size="sm"
                disabled={!linkTitle.trim() || createBookingLink.isPending}
                onClick={() => {
                  createBookingLink.mutate(
                    { title: linkTitle.trim(), durationMinutes: duration },
                    { onSuccess: () => setLinkTitle("") },
                  );
                }}
              >
                Create link
              </Button>
            </div>
            <ul className="space-y-2">
              {bookingLinks.map((link) => (
                <li
                  key={link.id}
                  className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{link.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {link.durationMinutes} min · /{link.slug}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Copy public link"
                    onClick={async () => {
                      await navigator.clipboard.writeText(link.publicUrl);
                      toast.success("Link copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section className="border-border bg-card space-y-4 rounded-xl border p-5">
            <h2 className="font-display text-lg font-semibold">Reminders</h2>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Email reminders</p>
                <p className="text-muted-foreground text-xs">Notify attendees before the meeting</p>
              </div>
              <Switch
                checked={reminders?.enabled ?? false}
                disabled={updateReminders.isPending}
                onCheckedChange={(enabled) =>
                  updateReminders.mutate({
                    enabled,
                    minutesBefore: reminders?.minutesBefore ?? 15,
                  })
                }
              />
            </div>
          </section>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule meeting</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="meeting-title">Title</Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product sync"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-time">Date & time</Label>
              <Input
                id="meeting-time"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meeting-provider">Provider</Label>
              <Select
                id="meeting-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as MeetingProvider)}
              >
                <option value="zoom">Zoom</option>
                <option value="meet">Google Meet</option>
                <option value="teams">Microsoft Teams</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!title.trim() || !startsAt || createMeeting.isPending}
              onClick={() => {
                createMeeting.mutate(
                  {
                    title: title.trim(),
                    startsAt: new Date(startsAt).toISOString(),
                    provider,
                  },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setTitle("");
                      setStartsAt("");
                      setProvider("zoom");
                    },
                  },
                );
              }}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
