"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickNumber, pickString } from "@/lib/api/org";
import { APP_NAME, isDemoMode } from "@/lib/constants";
import { getErrorMessage } from "@/lib/api/errors";

type PublicBookingLink = {
  slug: string;
  durationMinutes: number;
  isActive: boolean;
};

type PublicBookingPageProps = {
  slug: string;
};

async function fetchPublicLink(slug: string): Promise<PublicBookingLink> {
  if (isDemoMode()) {
    return { slug, durationMinutes: 30, isActive: true };
  }
  const payload = await api.get<Record<string, unknown>>(
    API_ENDPOINTS.meetings.publicBooking(slug),
    { token: null },
  );
  return {
    slug: pickString(payload, "slug") || slug,
    durationMinutes: pickNumber(payload, "durationMinutes", "duration_minutes") || 30,
    isActive: Boolean(payload.is_active ?? payload.isActive ?? true),
  };
}

export function PublicBookingPage({ slug }: PublicBookingPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [done, setDone] = useState(false);

  const linkQuery = useQuery({
    queryKey: ["public-booking", slug],
    queryFn: () => fetchPublicLink(slug),
  });

  const book = useMutation({
    mutationFn: async () => {
      if (isDemoMode()) return { ok: true };
      const start = new Date(startsAt);
      const end = new Date(start.getTime() + (linkQuery.data?.durationMinutes ?? 30) * 60_000);
      return api.post(
        API_ENDPOINTS.meetings.publicBooking(slug),
        {
          invitee_name: name.trim(),
          invitee_email: email.trim(),
          starts_at: start.toISOString(),
          ends_at: end.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        { token: null },
      );
    },
    onSuccess: () => setDone(true),
  });

  if (linkQuery.isLoading) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (linkQuery.isError || !linkQuery.data?.isActive) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-8 text-center">
        <Calendar className="text-muted-foreground h-10 w-10" aria-hidden />
        <h1 className="font-display text-xl font-semibold">Link unavailable</h1>
        <p className="text-muted-foreground text-sm">
          This booking link is inactive or does not exist.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" aria-hidden />
        <h1 className="font-display text-xl font-semibold">You&apos;re booked</h1>
        <p className="text-muted-foreground text-sm">A confirmation will be sent to {email}.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[70vh] max-w-md space-y-8 p-8">
      <div className="space-y-2 text-center">
        <Logo href="/" size="sm" className="mx-auto justify-center" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Book a meeting</h1>
        <p className="text-muted-foreground text-sm">
          {linkQuery.data.durationMinutes}-minute session via {APP_NAME}
        </p>
      </div>

      <form
        className="border-border bg-card space-y-4 rounded-xl border p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !email.trim() || !startsAt) return;
          book.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="book-name">Your name</Label>
          <Input
            id="book-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="book-email">Email</Label>
          <Input
            id="book-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="book-starts">Preferred time</Label>
          <Input
            id="book-starts"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            required
          />
        </div>
        {book.isError ? (
          <p className="text-destructive text-sm" role="alert">
            {getErrorMessage(book.error)}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={book.isPending || !name.trim() || !email.trim() || !startsAt}
        >
          {book.isPending ? "Booking…" : "Confirm booking"}
        </Button>
      </form>
    </div>
  );
}
