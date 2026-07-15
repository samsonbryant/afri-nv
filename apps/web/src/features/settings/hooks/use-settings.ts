"use client";

import { useMutation } from "@tanstack/react-query";
import { updatePreferences } from "@/features/settings/api/settings-api";
import type { UserPreferences } from "@/features/settings/types";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/errors";

export function useUpdatePreferences() {
  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) => updatePreferences(preferences),
    onSuccess: () => {
      toast.success("Preferences saved");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
