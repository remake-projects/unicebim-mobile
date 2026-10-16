import { useQuery } from '@tanstack/react-query';

import type { FixedExpenseInput } from '@/core/schemas/planning';
import { useUserId } from '@/features/auth/auth-provider';
import { queryKeys } from '@/lib/query-keys';
import { useInvalidatingMutation } from '@/lib/use-invalidating-mutation';
import {
  createFixedExpense,
  deleteFixedExpense,
  fetchFixedExpenses,
  updateFixedExpense,
  type FixedExpense,
} from './fixed-expenses-api';

export function useFixedExpenses() {
  return useQuery({ queryKey: queryKeys.fixedExpenses, queryFn: fetchFixedExpenses });
}

/** One fixed expense from the cached list. */
export function useFixedExpense(id: string) {
  return useQuery({
    queryKey: queryKeys.fixedExpenses,
    queryFn: fetchFixedExpenses,
    select: (items: FixedExpense[]) => items.find((e) => e.id === id) ?? null,
  });
}

/** A trigger keeps profiles.monthly_fixed_expenses in sync, so the profile changes too. */
const KEYS = [queryKeys.fixedExpenses, queryKeys.profile];

export function useCreateFixedExpense() {
  const userId = useUserId();
  return useInvalidatingMutation((input: FixedExpenseInput) => createFixedExpense(userId, input), KEYS);
}

export function useUpdateFixedExpense() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: FixedExpenseInput }) => updateFixedExpense(id, input),
    KEYS
  );
}

export function useDeleteFixedExpense() {
  return useInvalidatingMutation((id: string) => deleteFixedExpense(id), KEYS);
}
