import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Automation, PaginatedResponse } from "@/types/api";

export async function fetchAutomations(): Promise<PaginatedResponse<Automation>> {
  return api.get<PaginatedResponse<Automation>>(API_ENDPOINTS.automations.list);
}

export async function toggleAutomation(id: string): Promise<Automation> {
  return api.post<Automation>(API_ENDPOINTS.automations.toggle(id));
}
