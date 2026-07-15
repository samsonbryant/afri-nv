"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOrganizations } from "@/features/organizations/api/organizations-api";

export const organizationKeys = {
  all: ["organizations"] as const,
  lists: () => [...organizationKeys.all, "list"] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.lists(),
    queryFn: fetchOrganizations,
    enabled: false,
  });
}
