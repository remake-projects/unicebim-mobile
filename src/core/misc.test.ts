import { describe, expect, it } from 'vitest';

import { splitEqually, splitItemized } from './bill-splitter';
import { currencyChoices } from './currencies';
import { regionSettingsSchema } from './schemas/profile';
import { extractIban, formatIban, isValidIban } from './iban';
import { dailyTotals, fillMonthDays, summarizeTrend, weekOverWeekExpenses } from './stats';

describe('iban', () => {
  it('validates checksums for any country', () => {
    expect(isValidIban('TR33 0006 1005 1978 6457 8413 26')).toBe(true);
    expect(isValidIban('DE89370400440532013000')).toBe(true);
    expect(isValidIban('TR330006100519786457841327')).toBe(false);
    expect(isValidIban('hello')).toBe(false);
  });

  it('formats and extracts', () => {
    expect(formatIban('tr330006100519786457841326')).toBe('TR33 0006 1005 1978 6457 8413 26');
    expect(extractIban("TR33 0006 1005 1978 6457 8413 26'a gönderildi")).toBe('TR330006100519786457841326');
    expect(extractIban('no iban here')).toBeNull();
  });
});

describe('bill splitter', () => {
  it('splits equally with tip', () => {
    expect(splitEqually(300, 4, 10)).toEqual({ subtotal: 300, tip: 30, total: 330, perPerson: 82.5 });
    expect(splitEqually(300, 0, 0).perPerson).toBe(0);
  });

  it('splits itemized with a proportional tip', () => {
    const r = splitItemized([{ name: 'A', amount: 100 }, { name: 'B', amount: 50 }], 20);
    expect(r.shares.map((s) => [s.name, s.total])).toEqual([
      ['A', 120],
      ['B', 60],
    ]);
    expect(r.total).toBe(180);
  });
});

describe('stats', () => {
  const tz = 'Europe/Istanbul';
  const txs = [
    { date: '2026-10-12T21:30:00Z', type: 'expense' as const, amount: 10 }, // Oct 13 local
    { date: '2026-10-13T10:00:00Z', type: 'income' as const, amount: 100 },
    { date: '2026-10-06T10:00:00Z', type: 'expense' as const, amount: 5 }, // previous Tuesday
  ];

  it('groups by local day', () => {
    expect(dailyTotals(txs, tz)).toEqual([
      { date: '2026-10-06', income: 0, expense: 5 },
      { date: '2026-10-13', income: 100, expense: 10 },
    ]);
  });

  it('compares this week with last week (Monday first)', () => {
    const r = weekOverWeekExpenses(txs, '2026-10-13', tz);
    expect(r[1]).toEqual({ weekday: 2, current: 10, previous: 5 });
    expect(r).toHaveLength(7);
  });

  it('summarizes trends', () => {
    expect(
      summarizeTrend([
        { ym: '2026-09', income: 100, expense: 200 },
        { ym: '2026-10', income: 300, expense: 300 },
      ])
    ).toEqual({ averageIncome: 200, averageExpense: 250, expenseChangePercent: 50 });
  });
});

describe('fillMonthDays', () => {
  it('returns every day of the month, zero where nothing happened', () => {
    const days = fillMonthDays([{ date: '2026-02-10', income: 0, expense: 25 }], '2026-02');
    expect(days).toHaveLength(28);
    expect(days[0]).toEqual({ date: '2026-02-01', income: 0, expense: 0 });
    expect(days[9]).toEqual({ date: '2026-02-10', income: 0, expense: 25 });
  });
});

describe('region settings', () => {
  it('keeps the current currency first and unique', () => {
    expect(currencyChoices('EUR')[0]).toBe('EUR');
    expect(currencyChoices('EUR').filter((c) => c === 'EUR')).toHaveLength(1);
    expect(currencyChoices('ISK')[0]).toBe('ISK');
  });

  it('validates currency, time zone and locale tag', () => {
    expect(regionSettingsSchema.safeParse({ currency: 'EUR', timeZone: 'Europe/Berlin', locale: 'en-GB' }).success).toBe(true);
    expect(regionSettingsSchema.safeParse({ currency: 'eur', timeZone: 'Europe/Berlin', locale: 'en' }).success).toBe(false);
    expect(regionSettingsSchema.safeParse({ currency: 'EUR', timeZone: 'Mars/Base', locale: 'en' }).success).toBe(false);
    expect(regionSettingsSchema.safeParse({ currency: 'EUR', timeZone: 'UTC', locale: 'EN_us' }).success).toBe(false);
  });
});
