import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { UserPreferences } from "@/features/settings/types";
import type { User } from "@/types/api";

export async function fetchProfile(): Promise<User> {
  return api.get<User>(API_ENDPOINTS.settings.profile);
}

export async function updatePreferences(
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences> {
  return api.patch<UserPreferences>(API_ENDPOINTS.settings.preferences, preferences);
}
