import type { ActivityItem, DashboardStats } from "@/types/api";

export type DashboardOverview = {
  stats: DashboardStats;
  activity: ActivityItem[];
};
