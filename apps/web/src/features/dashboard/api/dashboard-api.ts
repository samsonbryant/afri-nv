import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ActivityItem, DashboardStats } from "@/types/api";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return api.get<DashboardStats>(API_ENDPOINTS.dashboard.stats);
}

export async function fetchDashboardActivity(): Promise<ActivityItem[]> {
  return api.get<ActivityItem[]>(API_ENDPOINTS.dashboard.activity);
}

export function getDemoDashboardStats(): DashboardStats {
  return {
    workflowsActive: 0,
    automationsRunning: 0,
    runsToday: 0,
    successRate: 100,
  };
}
