import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TransactionInput, UpdateTransactionInput } from '@/core/schemas/transaction';
import { monthRange, type YearMonth } from '@/core/time';
import { useUserId } from '@/features/auth/auth-provider';
import { useRegion } from '@/features/profile/use-region';
import { invalidateLedger, queryKeys, type TransactionListFilters } from '@/lib/query-keys';
import {
  createTransaction,
  deleteTransaction,
  fetchExpenseCategoryTotals,
  fetchMonthlyTrends,
  fetchMonthSummary,
  fetchRecentTransactions,
  fetchTransaction,
  fetchTransactionsInRange,
  fetchTransactionsPage,
  updateTransaction,
  type DateRange,
  type PageCursor,
  type Transaction,
} from './transactions-api';

export const RECENT_TRANSACTIONS_LIMIT = 5;

export function useTransactionList(filters: TransactionListFilters) {
  const { timeZone } = useRegion();
  return useInfiniteQuery({
    queryKey: queryKeys.transactionList(filters),
    queryFn: ({ pageParam }) => fetchTransactionsPage(filters, monthRange(filters.ym, timeZone), pageParam),
    initialPageParam: null as PageCursor | null,
    getNextPageParam: (page) => page.nextCursor,
  });
}

/** All income/expense rows in a range (charts, reports). */
export function useRangeTransactions(range: DateRange, type: 'income' | 'expense' | null = null) {
  const start = range.start.toISOString();
  const end = range.end.toISOString();
  return useQuery({
    queryKey: queryKeys.rangeTransactions(start, end, type),
    queryFn: () => fetchTransactionsInRange(range, type),
  });
}

export function useMonthlyTrends(months: number) {
  const { timeZone } = useRegion();
  return useQuery({ queryKey: queryKeys.monthlyTrends(months), queryFn: () => fetchMonthlyTrends(months, timeZone) });
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: queryKeys.recentTransactions,
    queryFn: () => fetchRecentTransactions(RECENT_TRANSACTIONS_LIMIT),
  });
}

export function useTransaction(id: string) {
  return useQuery({ queryKey: queryKeys.transaction(id), queryFn: () => fetchTransaction(id) });
}

export function useMonthSummary(ym: YearMonth, walletId: string | null = null) {
  const { timeZone } = useRegion();
  return useQuery({
    queryKey: queryKeys.monthSummary(ym, walletId),
    queryFn: () => fetchMonthSummary(monthRange(ym, timeZone), walletId),
  });
}

export function useExpenseCategoryTotals(ym: YearMonth) {
  const { timeZone } = useRegion();
  return useQuery({
    queryKey: queryKeys.categoryTotals(ym),
    queryFn: () => fetchExpenseCategoryTotals(monthRange(ym, timeZone)),
  });
}

export function useCreateTransaction() {
  const userId = useUserId();
  const { timeZone } = useRegion();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => createTransaction(userId, input, timeZone),
    onSuccess: () => invalidateLedger(client),
  });
}

export function useUpdateTransaction(original: Pick<Transaction, 'date'> | undefined) {
  const { timeZone } = useRegion();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTransactionInput) => {
      if (!original) throw new Error('updateTransaction needs the loaded transaction');
      return updateTransaction(input, original, timeZone);
    },
    onSuccess: () => invalidateLedger(client),
  });
}

export function useDeleteTransaction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (tx: Pick<Transaction, 'id' | 'transferGroupId'>) => deleteTransaction(tx),
    // Refetching the deleted row would only fail while its screen closes.
    onSuccess: (_, tx) => invalidateLedger(client, queryKeys.transaction(tx.id)),
  });
}
