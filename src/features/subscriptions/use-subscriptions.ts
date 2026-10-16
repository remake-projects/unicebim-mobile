import { useQuery } from '@tanstack/react-query';

import type { SubscriptionInput } from '@/core/schemas/planning';
import { useUserId } from '@/features/auth/auth-provider';
import { useRegion } from '@/features/profile/use-region';
import { queryKeys } from '@/lib/query-keys';
import { useInvalidatingMutation } from '@/lib/use-invalidating-mutation';
import {
  createSubscription,
  deleteSubscription,
  fetchSubscriptions,
  updateSubscription,
  type Subscription,
} from './subscriptions-api';

export function useSubscriptions() {
  return useQuery({ queryKey: queryKeys.subscriptions, queryFn: fetchSubscriptions });
}

/** One subscription from the cached list. */
export function useSubscription(id: string) {
  return useQuery({
    queryKey: queryKeys.subscriptions,
    queryFn: fetchSubscriptions,
    select: (subscriptions: Subscription[]) => subscriptions.find((s) => s.id === id) ?? null,
  });
}

export function useCreateSubscription() {
  const userId = useUserId();
  const { currency } = useRegion();
  return useInvalidatingMutation(
    (input: SubscriptionInput) => createSubscription(userId, currency, input),
    [queryKeys.subscriptions]
  );
}

export function useUpdateSubscription() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: SubscriptionInput }) => updateSubscription(id, input),
    [queryKeys.subscriptions]
  );
}

export function useDeleteSubscription() {
  return useInvalidatingMutation((id: string) => deleteSubscription(id), [queryKeys.subscriptions]);
}
