import { hashKey, type QueryClient, type QueryKey } from '@tanstack/react-query';

import type { YearMonth } from '@/core/time';

export type TransactionListFilters = {
  ym: YearMonth;
  type: 'income' | 'expense' | null;
  walletId: string | null;
};

/** TanStack Query keys. Every key the app uses is built here. */
export const queryKeys = {
  profile: ['profile'] as const,
  wallets: ['wallets'] as const,
  unpaidPayments: ['payments', 'unpaid'] as const,
  /** Prefix of every ledger-derived query below. */
  ledger: ['ledger'] as const,
  monthSummary: (ym: YearMonth, walletId: string | null) => ['ledger', 'summary', ym, walletId] as const,
  categoryTotals: (ym: YearMonth) => ['ledger', 'categoryTotals', ym] as const,
  transactionList: (filters: TransactionListFilters) => ['ledger', 'transactions', filters] as const,
  recentTransactions: ['ledger', 'recent'] as const,
  transaction: (id: string) => ['ledger', 'transaction', id] as const,
};

/**
 * A transaction or transfer changed: balances and every ledger view are stale.
 * `skip` leaves one query alone, e.g. the detail of a row that was just deleted.
 */
export function invalidateLedger(client: QueryClient, skip?: QueryKey): Promise<void> {
  const skipHash = skip && hashKey(skip);
  return Promise.all([
    client.invalidateQueries({ queryKey: queryKeys.ledger, predicate: (q) => q.queryHash !== skipHash }),
    client.invalidateQueries({ queryKey: queryKeys.wallets }),
  ]).then(() => undefined);
}
