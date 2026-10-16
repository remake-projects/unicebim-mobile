import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BudgetSettingsInput, RegionSettingsInput } from '@/core/schemas/profile';
import { useUserId } from '@/features/auth/auth-provider';
import { queryKeys } from '@/lib/query-keys';
import { pickAvatarImage } from './avatar-image';
import {
  fetchProfile,
  removeAvatar,
  updateBudgetSettings,
  updateFullName,
  updateRegionSettings,
  uploadAvatar,
  type Profile,
} from './profile-api';

export function useProfile() {
  const userId = useUserId();
  return useQuery({ queryKey: queryKeys.profile, queryFn: () => fetchProfile(userId) });
}

/** A profile write that returns the updated row, which replaces the cached profile. */
function useProfileMutation<TVariables>(mutationFn: (userId: string, variables: TVariables) => Promise<Profile>) {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => mutationFn(userId, variables),
    onSuccess: (profile) => client.setQueryData(queryKeys.profile, profile),
  });
}

export function useUpdateBudgetSettings() {
  return useProfileMutation((userId, input: BudgetSettingsInput) => updateBudgetSettings(userId, input));
}

export function useUpdateRegionSettings() {
  return useProfileMutation((userId, input: RegionSettingsInput) => updateRegionSettings(userId, input));
}

export function useUpdateFullName() {
  return useProfileMutation((userId, fullName: string) => updateFullName(userId, fullName));
}

/**
 * Picks, downsizes and uploads a new avatar. Resolves to null without changes when the
 * picker is cancelled.
 */
export function useChangeAvatar() {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (previousUrl: string | null) => {
      const fileUri = await pickAvatarImage();
      return fileUri ? uploadAvatar(userId, fileUri, previousUrl) : null;
    },
    onSuccess: (profile) => {
      if (profile) client.setQueryData(queryKeys.profile, profile);
    },
  });
}

export function useRemoveAvatar() {
  return useProfileMutation((userId, previousUrl: string | null) => removeAvatar(userId, previousUrl));
}
