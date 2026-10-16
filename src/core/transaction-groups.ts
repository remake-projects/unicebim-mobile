import { roundMoney } from './number';
import { ymdInZone, type Ymd } from './time';

export type DayGroup<T> = { date: Ymd; items: T[] };

/**
 * Group transactions (already sorted newest first) by their calendar day in `timeZone`,
 * keeping the input order. Used for the day headers of transaction lists.
 */
export function groupByDay<T extends { date: string }>(items: readonly T[], timeZone: string): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  for (const item of items) {
    const date = ymdInZone(item.date, timeZone);
    const last = groups.at(-1);
    if (last?.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  }
  return groups;
}

type Ledgerish = { amount: number; type: 'income' | 'expense'; isTransfer: boolean };

/** Income minus expenses of one day's rows; transfers only move money and are left out. */
export function dayNet(items: readonly Ledgerish[]): number {
  let net = 0;
  for (const item of items) {
    if (item.isTransfer) continue;
    net += item.type === 'income' ? Math.abs(item.amount) : -Math.abs(item.amount);
  }
  return roundMoney(net);
}
