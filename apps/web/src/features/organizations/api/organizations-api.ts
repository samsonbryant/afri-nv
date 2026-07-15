import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Organization, PaginatedResponse } from "@/types/api";

export async function fetchOrganizations(): Promise<PaginatedResponse<Organization>> {
  return api.get<PaginatedResponse<Organization>>(API_ENDPOINTS.organizations.list);
}

export async function fetchOrganization(id: string): Promise<Organization> {
  return api.get<Organization>(API_ENDPOINTS.organizations.detail(id));
}
