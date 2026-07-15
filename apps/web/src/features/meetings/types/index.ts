export type MeetingProvider = "zoom" | "meet" | "teams";

export type MeetingStatus = "scheduled" | "completed" | "cancelled";

export type Meeting = {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  provider: MeetingProvider;
  joinUrl?: string | null;
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
};

export type CalendarProvider = "google" | "microsoft";

export type CalendarConnection = {
  id: string;
  provider: CalendarProvider;
  email?: string;
  connected: boolean;
  connectedAt?: string | null;
};

export type BookingLink = {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  publicUrl: string;
  enabled: boolean;
  createdAt: string;
};

export type ReminderSettings = {
  enabled: boolean;
  minutesBefore: number;
};

export type CreateMeetingInput = {
  title: string;
  startsAt: string;
  provider: MeetingProvider;
};

export type CreateBookingLinkInput = {
  title: string;
  durationMinutes: number;
  slug?: string;
};
