import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BudgetSettingsInput } from '@/core/schemas/profile';
import { useUserId } from '@/features/auth/auth-provider';
import { queryKeys } from '@/lib/query-keys';
import { fetchProfile, updateBudgetSettings } from './profile-api';

export function useProfile() {
  const userId = useUserId();
  return useQuery({ queryKey: queryKeys.profile, queryFn: () => fetchProfile(userId) });
}

export function useUpdateBudgetSettings() {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: BudgetSettingsInput) => updateBudgetSettings(userId, input),
    onSuccess: (profile) => client.setQueryData(queryKeys.profile, profile),
  });
}
