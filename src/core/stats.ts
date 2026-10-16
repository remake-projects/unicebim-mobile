import { roundMoney } from './number';
import { addDays, daysInMonth, isoWeekday, startOfIsoWeek, ymdInZone, type Ymd, type YearMonth } from './time';

export type StatTransaction = { date: string; type: 'income' | 'expense'; amount: number };
export type DayTotals = { date: Ymd; income: number; expense: number };

/** Income/expense per calendar day in the user's time zone, oldest first. */
export function dailyTotals(transactions: readonly StatTransaction[], timeZone: string): DayTotals[] {
  const byDay = new Map<Ymd, DayTotals>();
  for (const t of transactions) {
    const date = ymdInZone(t.date, timeZone);
    const row = byDay.get(date) ?? { date, income: 0, expense: 0 };
    row[t.type] = roundMoney(row[t.type] + t.amount);
    byDay.set(date, row);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** One row per day of `ym` (days without entries are zero), for a full-month chart. */
export function fillMonthDays(days: readonly DayTotals[], ym: YearMonth): DayTotals[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const count = daysInMonth(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)));
  return Array.from({ length: count }, (_, i) => {
    const date = `${ym}-${String(i + 1).padStart(2, '0')}`;
    return byDate.get(date) ?? { date, income: 0, expense: 0 };
  });
}

export type WeekdayComparison = { weekday: number; current: number; previous: number };

/** Expenses per weekday (ISO, Monday first) for this week vs. last week. */
export function weekOverWeekExpenses(
  transactions: readonly StatTransaction[],
  today: Ymd,
  timeZone: string
): WeekdayComparison[] {
  const thisWeek = startOfIsoWeek(today);
  const lastWeek = addDays(thisWeek, -7);
  const rows = Array.from({ length: 7 }, (_, i) => ({ weekday: i + 1, current: 0, previous: 0 }));
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const date = ymdInZone(t.date, timeZone);
    const week = startOfIsoWeek(date);
    const row = rows[isoWeekday(date) - 1]!;
    if (week === thisWeek) row.current = roundMoney(row.current + t.amount);
    else if (week === lastWeek) row.previous = roundMoney(row.previous + t.amount);
  }
  return rows;
}

export type MonthTotals = { ym: YearMonth; income: number; expense: number };

export type TrendSummary = {
  averageIncome: number;
  averageExpense: number;
  /** % change of the last month's expense vs. the month before; null when not comparable. */
  expenseChangePercent: number | null;
};

/** Summary over consecutive months, oldest first (e.g. from get_monthly_trends). */
export function summarizeTrend(months: readonly MonthTotals[]): TrendSummary {
  if (months.length === 0) return { averageIncome: 0, averageExpense: 0, expenseChangePercent: null };
  const averageIncome = roundMoney(months.reduce((s, m) => s + m.income, 0) / months.length);
  const averageExpense = roundMoney(months.reduce((s, m) => s + m.expense, 0) / months.length);
  const last = months[months.length - 1]!;
  const prev = months[months.length - 2];
  const expenseChangePercent = prev && prev.expense > 0 ? ((last.expense - prev.expense) / prev.expense) * 100 : null;
  return { averageIncome, averageExpense, expenseChangePercent };
}
