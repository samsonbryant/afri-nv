import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { pickIso, pickNumber, pickString, unwrapList, withOrg } from "@/lib/api/org";
import { APP_URL, isDemoMode } from "@/lib/constants";
import type {
  BookingLink,
  CalendarConnection,
  CreateBookingLinkInput,
  CreateMeetingInput,
  Meeting,
  MeetingProvider,
  ReminderSettings,
} from "@/features/meetings/types";

const now = Date.now();

let demoMeetings: Meeting[] = [
  {
    id: "mtg-1",
    title: "Product sync",
    startsAt: new Date(now + 86400000).toISOString(),
    endsAt: new Date(now + 86400000 + 3600000).toISOString(),
    provider: "zoom",
    joinUrl: "https://zoom.us/j/demo",
    status: "scheduled",
    createdAt: new Date(now - 86400000).toISOString(),
    updatedAt: new Date(now - 86400000).toISOString(),
  },
  {
    id: "mtg-2",
    title: "Customer discovery",
    startsAt: new Date(now + 86400000 * 3).toISOString(),
    provider: "meet",
    joinUrl: "https://meet.google.com/demo",
    status: "scheduled",
    createdAt: new Date(now - 3600000).toISOString(),
    updatedAt: new Date(now - 3600000).toISOString(),
  },
];

let demoConnections: CalendarConnection[] = [
  {
    id: "conn-google",
    provider: "google",
    email: "you@company.com",
    connected: false,
    connectedAt: null,
  },
  {
    id: "conn-ms",
    provider: "microsoft",
    connected: false,
    connectedAt: null,
  },
];

let demoBookingLinks: BookingLink[] = [
  {
    id: "bk-1",
    title: "30-min intro",
    slug: "intro-30",
    durationMinutes: 30,
    publicUrl: `${APP_URL}/book/intro-30`,
    enabled: true,
    createdAt: new Date(now - 86400000 * 2).toISOString(),
  },
];

let demoReminders: ReminderSettings = {
  enabled: true,
  minutesBefore: 15,
};

function mapProvider(value: unknown): MeetingProvider {
  const v = String(value ?? "zoom").toLowerCase();
  if (v === "meet" || v === "google_meet" || v === "google") return "meet";
  if (v === "teams" || v === "microsoft_teams") return "teams";
  return "zoom";
}

function mapMeeting(raw: Record<string, unknown>): Meeting {
  const statusRaw = pickString(raw, "status") || "scheduled";
  const status = statusRaw === "completed" || statusRaw === "cancelled" ? statusRaw : "scheduled";
  return {
    id: String(raw.id),
    title: pickString(raw, "title", "name") || "Meeting",
    startsAt: pickIso(raw, "startsAt", "starts_at", "start_time"),
    endsAt:
      (raw.endsAt as string | null | undefined) ??
      (raw.ends_at as string | null | undefined) ??
      null,
    provider: mapProvider(raw.provider),
    joinUrl:
      (raw.joinUrl as string | null | undefined) ??
      (raw.join_url as string | null | undefined) ??
      null,
    status,
    createdAt: pickIso(raw, "createdAt", "created_at"),
    updatedAt: pickIso(raw, "updatedAt", "updated_at"),
  };
}

function mapConnection(raw: Record<string, unknown>): CalendarConnection {
  const providerRaw = pickString(raw, "provider").toLowerCase();
  const provider = providerRaw.includes("micro") ? "microsoft" : "google";
  return {
    id: String(raw.id ?? provider),
    provider,
    email: pickString(raw, "email", "account") || undefined,
    connected: Boolean(raw.connected ?? raw.is_connected ?? false),
    connectedAt:
      (raw.connectedAt as string | null | undefined) ??
      (raw.connected_at as string | null | undefined) ??
      null,
  };
}

function mapBookingLink(raw: Record<string, unknown>): BookingLink {
  const slug = pickString(raw, "slug") || String(raw.id);
  return {
    id: String(raw.id),
    title: pickString(raw, "title", "name") || "Booking link",
    slug,
    durationMinutes: pickNumber(raw, "durationMinutes", "duration_minutes") || 30,
    publicUrl: pickString(raw, "publicUrl", "public_url") || `${APP_URL}/book/${slug}`,
    enabled: Boolean(raw.enabled ?? true),
    createdAt: pickIso(raw, "createdAt", "created_at"),
  };
}

export async function fetchMeetings(organizationId?: string | null): Promise<Meeting[]> {
  if (isDemoMode()) return [...demoMeetings];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.meetings.list, organizationId));
    return unwrapList(payload).map(mapMeeting);
  } catch {
    return [];
  }
}

export async function createMeeting(
  input: CreateMeetingInput,
  organizationId?: string | null,
): Promise<Meeting> {
  if (isDemoMode()) {
    const meeting: Meeting = {
      id: `mtg-${Date.now()}`,
      title: input.title,
      startsAt: input.startsAt,
      provider: input.provider,
      joinUrl: null,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    demoMeetings = [meeting, ...demoMeetings];
    return meeting;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.meetings.create, organizationId),
    {
      title: input.title,
      starts_at: input.startsAt,
      provider: input.provider,
      organization_id: organizationId,
    },
  );
  return mapMeeting(payload);
}

export async function fetchCalendarConnections(
  organizationId?: string | null,
): Promise<CalendarConnection[]> {
  if (isDemoMode()) return [...demoConnections];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.meetings.connections, organizationId));
    return unwrapList(payload).map(mapConnection);
  } catch {
    return [];
  }
}

export async function connectCalendar(
  provider: "google" | "microsoft",
  organizationId?: string | null,
): Promise<CalendarConnection> {
  if (isDemoMode()) {
    demoConnections = demoConnections.map((c) =>
      c.provider === provider
        ? {
            ...c,
            connected: true,
            connectedAt: new Date().toISOString(),
            email: c.email ?? "you@company.com",
          }
        : c,
    );
    return demoConnections.find((c) => c.provider === provider)!;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.meetings.connect(provider), organizationId),
    { organization_id: organizationId },
  );
  return mapConnection(payload);
}

export async function fetchBookingLinks(organizationId?: string | null): Promise<BookingLink[]> {
  if (isDemoMode()) return [...demoBookingLinks];
  try {
    const payload = await api.get<
      Record<string, unknown>[] | { results: Record<string, unknown>[] }
    >(withOrg(API_ENDPOINTS.meetings.bookingLinks, organizationId));
    return unwrapList(payload).map(mapBookingLink);
  } catch {
    return [];
  }
}

export async function createBookingLink(
  input: CreateBookingLinkInput,
  organizationId?: string | null,
): Promise<BookingLink> {
  if (isDemoMode()) {
    const slug =
      input.slug ||
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const link: BookingLink = {
      id: `bk-${Date.now()}`,
      title: input.title,
      slug,
      durationMinutes: input.durationMinutes,
      publicUrl: `${APP_URL}/book/${slug}`,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    demoBookingLinks = [link, ...demoBookingLinks];
    return link;
  }

  const payload = await api.post<Record<string, unknown>>(
    withOrg(API_ENDPOINTS.meetings.bookingLinks, organizationId),
    {
      title: input.title,
      duration_minutes: input.durationMinutes,
      slug: input.slug,
      organization_id: organizationId,
    },
  );
  return mapBookingLink(payload);
}

export async function fetchReminderSettings(
  organizationId?: string | null,
): Promise<ReminderSettings> {
  if (isDemoMode()) return { ...demoReminders };
  // Backend reminders are meeting-scoped; org-level settings fall back to defaults.
  void organizationId;
  return { enabled: false, minutesBefore: 15 };
}

export async function updateReminderSettings(
  settings: ReminderSettings,
  organizationId?: string | null,
): Promise<ReminderSettings> {
  if (isDemoMode()) {
    demoReminders = { ...settings };
    return { ...demoReminders };
  }
  void organizationId;
  return { ...settings };
}
