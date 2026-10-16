import { describe, expect, it } from 'vitest';

import { expenseByCategory, reportTotals, toCsv } from './report';

const entries = [
  { type: 'income' as const, category: 'job', amount: 1000 },
  { type: 'expense' as const, category: 'food', amount: 120.5 },
  { type: 'expense' as const, category: 'food', amount: 30 },
  { type: 'expense' as const, category: 'transport', amount: 50 },
];

describe('report', () => {
  it('totals income and expenses', () => {
    expect(reportTotals(entries)).toEqual({ count: 4, income: 1000, expense: 200.5, net: 799.5 });
    expect(reportTotals([])).toEqual({ count: 0, income: 0, expense: 0, net: 0 });
  });

  it('groups expenses by category', () => {
    expect(expenseByCategory(entries)).toEqual([
      { category: 'food', amount: 150.5 },
      { category: 'transport', amount: 50 },
    ]);
  });

  it('writes RFC 4180 CSV with a BOM', () => {
    const csv = toCsv([
      ['Tarih', 'Açıklama', 'Tutar'],
      ['2026-10-16', 'Kahve, simit', 12.5],
      ['2026-10-17', 'He said "hi"\nbye', null],
    ]);
    expect(csv).toBe(
      '﻿Tarih,Açıklama,Tutar\r\n2026-10-16,"Kahve, simit",12.5\r\n2026-10-17,"He said ""hi""\nbye",\r\n'
    );
  });
});
