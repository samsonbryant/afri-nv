"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  connectCalendar,
  createBookingLink,
  createMeeting,
  fetchBookingLinks,
  fetchCalendarConnections,
  fetchMeetings,
  fetchReminderSettings,
  updateReminderSettings,
} from "@/features/meetings/api/meetings-api";
import type {
  CreateBookingLinkInput,
  CreateMeetingInput,
  ReminderSettings,
} from "@/features/meetings/types";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import { getErrorMessage } from "@/lib/api/errors";

export const meetingKeys = {
  all: ["meetings"] as const,
  list: (orgId: string | null) => [...meetingKeys.all, "list", orgId] as const,
  connections: (orgId: string | null) => [...meetingKeys.all, "connections", orgId] as const,
  bookingLinks: (orgId: string | null) => [...meetingKeys.all, "booking-links", orgId] as const,
  reminders: (orgId: string | null) => [...meetingKeys.all, "reminders", orgId] as const,
};

export function useMeetings() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: meetingKeys.list(orgId),
    queryFn: () => fetchMeetings(orgId),
    enabled: Boolean(orgId),
    refetchInterval: 12000,
  });
}

export function useCalendarConnections() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: meetingKeys.connections(orgId),
    queryFn: () => fetchCalendarConnections(orgId),
    enabled: Boolean(orgId),
    refetchInterval: 15000,
  });
}

export function useBookingLinks() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: meetingKeys.bookingLinks(orgId),
    queryFn: () => fetchBookingLinks(orgId),
    enabled: Boolean(orgId),
  });
}

export function useReminderSettings() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: meetingKeys.reminders(orgId),
    queryFn: () => fetchReminderSettings(orgId),
    enabled: Boolean(orgId),
  });
}

export function useCreateMeeting() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) => createMeeting(input, orgId),
    onSuccess: () => {
      toast.success("Meeting scheduled");
      void queryClient.invalidateQueries({ queryKey: meetingKeys.list(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useConnectCalendar() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: "google" | "microsoft") => connectCalendar(provider, orgId),
    onSuccess: (data, provider) => {
      const oauthUrl =
        data && typeof data === "object" && "oauthUrl" in data
          ? String((data as { oauthUrl?: string }).oauthUrl || "")
          : "";
      if (oauthUrl) {
        window.open(oauthUrl, "_blank", "noopener,noreferrer");
        toast.message("Complete calendar authorization in the new tab");
      } else {
        toast.success(`${provider === "google" ? "Google" : "Microsoft"} calendar connected`);
      }
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.connections(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateBookingLink() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBookingLinkInput) => createBookingLink(input, orgId),
    onSuccess: () => {
      toast.success("Booking link created");
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.bookingLinks(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateReminders() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: ReminderSettings) => updateReminderSettings(settings, orgId),
    onSuccess: () => {
      toast.success("Reminders updated");
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.reminders(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
