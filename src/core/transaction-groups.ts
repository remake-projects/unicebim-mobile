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
