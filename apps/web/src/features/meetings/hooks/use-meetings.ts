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
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const meetingKeys = {
  all: ["meetings"] as const,
  list: (orgId: string | null) => [...meetingKeys.all, "list", orgId] as const,
  connections: (orgId: string | null) => [...meetingKeys.all, "connections", orgId] as const,
  bookingLinks: (orgId: string | null) => [...meetingKeys.all, "booking-links", orgId] as const,
  reminders: (orgId: string | null) => [...meetingKeys.all, "reminders", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function useMeetings() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: meetingKeys.list(orgId),
    queryFn: () => fetchMeetings(orgId),
  });
}

export function useCalendarConnections() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: meetingKeys.connections(orgId),
    queryFn: () => fetchCalendarConnections(orgId),
  });
}

export function useBookingLinks() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: meetingKeys.bookingLinks(orgId),
    queryFn: () => fetchBookingLinks(orgId),
  });
}

export function useReminderSettings() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: meetingKeys.reminders(orgId),
    queryFn: () => fetchReminderSettings(orgId),
  });
}

export function useCreateMeeting() {
  const orgId = useOrgId();
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
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (provider: "google" | "microsoft") => connectCalendar(provider, orgId),
    onSuccess: (_data, provider) => {
      toast.success(`${provider === "google" ? "Google" : "Microsoft"} calendar connected`);
      void queryClient.invalidateQueries({
        queryKey: meetingKeys.connections(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateBookingLink() {
  const orgId = useOrgId();
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
  const orgId = useOrgId();
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
