import type { TFunction } from 'i18next';

import { toCsv } from '@/core/report';
import { ymdInZone } from '@/core/time';
import type { Transaction } from '@/features/transactions/transactions-api';

type Context = {
  t: TFunction;
  categoryLabel: (category: string) => string;
  walletNames: ReadonlyMap<string, string>;
  timeZone: string;
  currency: string;
};

/** One row per transaction with translated headers, types and categories. */
export function buildReportCsv(items: readonly Transaction[], { t, categoryLabel, walletNames, timeZone, currency }: Context): string {
  const c = (key: 'date' | 'type' | 'category' | 'description' | 'wallet' | 'amount' | 'currency') =>
    t(`report.columns.${key}`);
  return toCsv([
    [c('date'), c('type'), c('category'), c('description'), c('wallet'), c('amount'), c('currency')],
    ...items.map((tx) => [
      ymdInZone(tx.date, timeZone),
      t(`transactions.type.${tx.type}`),
      categoryLabel(tx.category),
      tx.description,
      tx.walletId ? (walletNames.get(tx.walletId) ?? '') : t('transactions.noWallet'),
      tx.amount,
      currency,
    ]),
  ]);
}
