"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AttachCardInput,
  CheckoutInput,
  CouponInput,
  CreateManualPaymentInput,
} from "@/features/billing/types";
import {
  applyCoupon,
  attachCard,
  createCheckout,
  createManualPayment,
  fetchInvoices,
  fetchManualPaymentInstructions,
  fetchManualPayments,
  fetchPlans,
  fetchSubscription,
  fetchUsage,
} from "@/features/billing/api/billing-api";
import { useAuthStore } from "@/features/auth/stores/auth-store";
import { useOrganizationsStore } from "@/features/organizations/stores/organizations-store";
import { getErrorMessage } from "@/lib/api/errors";

export const billingKeys = {
  all: ["billing"] as const,
  plans: (orgId: string | null) => [...billingKeys.all, "plans", orgId] as const,
  subscription: (orgId: string | null) => [...billingKeys.all, "subscription", orgId] as const,
  invoices: (orgId: string | null) => [...billingKeys.all, "invoices", orgId] as const,
  usage: (orgId: string | null) => [...billingKeys.all, "usage", orgId] as const,
  manualInstructions: () => [...billingKeys.all, "manual-instructions"] as const,
  manualPayments: (orgId: string | null) => [...billingKeys.all, "manual-payments", orgId] as const,
};

function useOrgId() {
  const storeId = useOrganizationsStore((s) => s.activeOrganizationId);
  const authOrgId = useAuthStore((s) => s.organization?.id ?? null);
  return storeId ?? authOrgId;
}

export function usePlans() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: billingKeys.plans(orgId),
    queryFn: () => fetchPlans(orgId),
    enabled: Boolean(orgId),
  });
}

export function useSubscription() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: billingKeys.subscription(orgId),
    queryFn: () => fetchSubscription(orgId),
    enabled: Boolean(orgId),
  });
}

export function useInvoices() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: billingKeys.invoices(orgId),
    queryFn: () => fetchInvoices(orgId),
    enabled: Boolean(orgId),
  });
}

export function useUsageMeters() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: billingKeys.usage(orgId),
    queryFn: () => fetchUsage(orgId),
    enabled: Boolean(orgId),
  });
}

export function useCheckout() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => createCheckout(input, orgId),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscription(orgId) });
      void queryClient.invalidateQueries({ queryKey: billingKeys.plans(orgId) });
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      toast.success("14-day trial started — save your card for auto-debit");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useApplyCoupon() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CouponInput) => applyCoupon(input, orgId),
    onSuccess: (result) => {
      toast.success(result.message);
      void queryClient.invalidateQueries({
        queryKey: billingKeys.subscription(orgId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useManualPaymentInstructions() {
  return useQuery({
    queryKey: billingKeys.manualInstructions(),
    queryFn: fetchManualPaymentInstructions,
  });
}

export function useManualPayments() {
  const orgId = useOrgId();
  return useQuery({
    queryKey: billingKeys.manualPayments(orgId),
    queryFn: () => fetchManualPayments(orgId),
    enabled: Boolean(orgId),
  });
}

export function useCreateManualPayment() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManualPaymentInput) => createManualPayment(input, orgId),
    onSuccess: () => {
      toast.success("Payment submitted for admin approval");
      void queryClient.invalidateQueries({ queryKey: billingKeys.manualPayments(orgId) });
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscription(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAttachCard() {
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AttachCardInput) => attachCard(input, orgId),
    onSuccess: () => {
      toast.success("Card saved — trial will auto-charge when it ends");
      void queryClient.invalidateQueries({ queryKey: billingKeys.subscription(orgId) });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
