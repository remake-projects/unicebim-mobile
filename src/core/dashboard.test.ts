import { describe, expect, it } from 'vitest';

import { buildDashboard, type DashboardInput } from './dashboard';
import { groupByDay } from './transaction-groups';
import { formatYearMonth, formatYmd } from './time';

const base: DashboardInput = {
  today: '2026-10-22', // 10 days left including today
  walletBalances: [1500, 700],
  unpaidPaymentAmounts: [200],
  month: { incomeTotal: 3000, expenseTotal: 900, fixedExpensesPaid: 300 },
  expenseByCategory: [
    { category: 'food', amount: 400 },
    { category: 'social', amount: 500 },
  ],
  profile: { monthlyBudgetGoal: 2000, monthlyFixedExpenses: 800, mealPrice: 50, nextIncomeDate: '2026-11-01' },
};

describe('buildDashboard', () => {
  it('derives spendable money from wallets minus unpaid payments', () => {
    const d = buildDashboard(base);
    expect(d.spendable).toEqual({ walletTotal: 2200, reserved: 200, spendable: 2000 });
  });

  it('keeps the remaining fixed costs out of the daily limit', () => {
    const d = buildDashboard(base);
    // (2000 − (800 − 300)) / 10 days
    expect(d.dailyBudget).toEqual({ remainingDays: 10, remainingFixedExpenses: 500, dailyLimit: 150 });
    expect(d.dailyLimitLevel).toBe('ok');
  });

  it('computes the insights', () => {
    const d = buildDashboard(base);
    expect(d.mealIndex).toEqual({ meals: 40, remainder: 0 });
    expect(d.incomeCountdown).toMatchObject({ status: 'upcoming', daysRemaining: 10, dailyLimit: 200 });
    expect(d.socialScore?.isDanger).toBe(true);
    expect(d.budgetProgress).toMatchObject({ goal: 2000, spent: 900, remaining: 1100 });
  });

  it('works without optional profile settings', () => {
    const d = buildDashboard({
      ...base,
      profile: { monthlyBudgetGoal: null, monthlyFixedExpenses: null, mealPrice: null, nextIncomeDate: null },
    });
    expect(d.mealIndex).toBeNull();
    expect(d.incomeCountdown).toBeNull();
    expect(d.budgetProgress).toBeNull();
    expect(d.dailyBudget.dailyLimit).toBe(200);
  });

  it('flags a negative daily limit when payments exceed the wallets', () => {
    const d = buildDashboard({ ...base, unpaidPaymentAmounts: [5000] });
    expect(d.spendable.spendable).toBe(-2800);
    expect(d.dailyLimitLevel).toBe('negative');
    expect(d.mealIndex).toEqual({ meals: 0, remainder: 0 });
  });
});

describe('groupByDay', () => {
  it('groups by the calendar day in the user time zone', () => {
    const rows = [
      { id: 'a', date: '2026-10-14T21:30:00Z' }, // Oct 15 in Istanbul
      { id: 'b', date: '2026-10-14T20:00:00Z' },
      { id: 'c', date: '2026-10-13T09:00:00Z' },
    ];
    expect(groupByDay(rows, 'Europe/Istanbul').map((g) => [g.date, g.items.map((i) => i.id)])).toEqual([
      ['2026-10-15', ['a']],
      ['2026-10-14', ['b']],
      ['2026-10-13', ['c']],
    ]);
    expect(groupByDay(rows, 'UTC').map((g) => g.items.length)).toEqual([2, 1]);
  });
});

describe('date display', () => {
  it('formats calendar dates without shifting the day', () => {
    expect(formatYmd('2026-01-01', 'en-US', { month: 'short', day: 'numeric' })).toBe('Jan 1');
    expect(formatYearMonth('2026-10', 'tr-TR')).toBe('Ekim 2026');
  });
});
