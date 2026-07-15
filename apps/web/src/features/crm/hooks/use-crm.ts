"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";
import { useActiveOrganizationId } from "@/features/organizations/hooks/use-organizations";
import {
  fetchCompanies,
  createCompany,
  fetchContacts,
  createContact,
  fetchLeads,
  createLead,
  convertLead,
  fetchOpportunities,
  createOpportunity,
  updateOpportunityStage,
  fetchPipeline,
  fetchActivities,
  triggerFollowUp,
} from "@/features/crm/api/crm-api";
import type {
  CreateCompanyPayload,
  CreateContactPayload,
  CreateLeadPayload,
  CreateOpportunityPayload,
  PipelineStage,
} from "@/features/crm/types";

export const crmKeys = {
  all: ["crm"] as const,
  companies: (orgId: string | null) => [...crmKeys.all, "companies", orgId] as const,
  contacts: (orgId: string | null) => [...crmKeys.all, "contacts", orgId] as const,
  leads: (orgId: string | null) => [...crmKeys.all, "leads", orgId] as const,
  opportunities: (orgId: string | null) => [...crmKeys.all, "opportunities", orgId] as const,
  pipeline: (orgId: string | null) => [...crmKeys.all, "pipeline", orgId] as const,
  activities: (orgId: string | null) => [...crmKeys.all, "activities", orgId] as const,
};

export function useCompanies() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: crmKeys.companies(orgId),
    queryFn: () => fetchCompanies(orgId),
  });
}

export function useCreateCompany() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCompanyPayload) => createCompany(payload, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.companies(orgId) });
      toast.success("Company created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useContacts() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: crmKeys.contacts(orgId),
    queryFn: () => fetchContacts(orgId),
  });
}

export function useCreateContact() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContactPayload) => createContact(payload, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.contacts(orgId) });
      toast.success("Contact created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useLeads() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: crmKeys.leads(orgId),
    queryFn: () => fetchLeads(orgId),
  });
}

export function useCreateLead() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.leads(orgId) });
      toast.success("Lead created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useConvertLead() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => convertLead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.leads(orgId) });
      void queryClient.invalidateQueries({ queryKey: crmKeys.contacts(orgId) });
      void queryClient.invalidateQueries({ queryKey: crmKeys.companies(orgId) });
      toast.success("Lead converted to contact");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useOpportunities() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: crmKeys.opportunities(orgId),
    queryFn: () => fetchOpportunities(orgId),
  });
}

export function useCreateOpportunity() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => createOpportunity(payload, orgId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.opportunities(orgId) });
      void queryClient.invalidateQueries({ queryKey: crmKeys.pipeline(orgId) });
      toast.success("Opportunity created");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateOpportunityStage() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) =>
      updateOpportunityStage(id, { stage }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.opportunities(orgId) });
      void queryClient.invalidateQueries({ queryKey: crmKeys.pipeline(orgId) });
      toast.success("Stage updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function usePipeline() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: crmKeys.pipeline(orgId),
    queryFn: () => fetchPipeline(orgId),
  });
}

export function useActivities() {
  const orgId = useActiveOrganizationId();
  return useQuery({
    queryKey: crmKeys.activities(orgId),
    queryFn: () => fetchActivities(orgId),
  });
}

export function useFollowUp() {
  const orgId = useActiveOrganizationId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => triggerFollowUp(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: crmKeys.activities(orgId) });
      toast.success("AI follow-up generated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
