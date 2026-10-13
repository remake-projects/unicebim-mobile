import { describe, expect, it } from 'vitest';

import { averageDailyExpense, calculateBudgetProgress, calculateDailyBudget, calculateSpendable, needsOnboarding } from './budget';
import {
  calculateIncomeCountdown,
  calculateMealIndex,
  calculateSocialScore,
  dailyLimitLevel,
  getExpenseBreakdown,
} from './insights';
import { analyzePayments } from './payment-analysis';

describe('budget', () => {
  it('reserves unpaid payments from wallet balances', () => {
    expect(calculateSpendable({ walletBalances: [1000, 250.5], unpaidPaymentAmounts: [400, 100] })).toEqual({
      walletTotal: 1250.5,
      reserved: 500,
      spendable: 750.5,
    });
  });

  it('spreads spendable money minus remaining fixed costs over the rest of the month', () => {
    const r = calculateDailyBudget({ spendable: 1900, plannedFixedExpenses: 500, fixedExpensesPaid: 200, today: '2026-01-13' });
    expect(r).toEqual({ remainingDays: 19, remainingFixedExpenses: 300, dailyLimit: 84.21 });
  });

  it('reports budget progress only for a positive goal', () => {
    expect(calculateBudgetProgress(null, 10)).toBeNull();
    expect(calculateBudgetProgress(1000, 250)).toEqual({ goal: 1000, spent: 250, remaining: 750, ratio: 0.25 });
    expect(needsOnboarding({ monthlyBudgetGoal: 0 })).toBe(true);
    expect(needsOnboarding({ monthlyBudgetGoal: 5000 })).toBe(false);
  });

  it('averages spending over elapsed days', () => {
    expect(averageDailyExpense(300, '2026-10-10')).toBe(30);
  });
});

describe('insights', () => {
  it('measures limits in meals when a meal price is set', () => {
    expect(dailyLimitLevel(-1, 50)).toBe('negative');
    expect(dailyLimitLevel(40, 50)).toBe('low');
    expect(dailyLimitLevel(80, 50)).toBe('medium');
    expect(dailyLimitLevel(120, 50)).toBe('ok');
    expect(dailyLimitLevel(5, null)).toBe('ok');
  });

  it('computes the meal index', () => {
    expect(calculateMealIndex(530, 50)).toEqual({ meals: 10, remainder: 30 });
    expect(calculateMealIndex(-20, 50)).toEqual({ meals: 0, remainder: 0 });
    expect(calculateMealIndex(530, null)).toBeNull();
  });

  it('counts down to the next income', () => {
    expect(calculateIncomeCountdown({ balance: 1000, nextIncomeDate: '2026-10-23', today: '2026-10-13', mealPrice: 50 })).toMatchObject({
      status: 'upcoming',
      daysRemaining: 10,
      dailyLimit: 100,
      level: 'ok',
    });
    expect(calculateIncomeCountdown({ balance: 1000, nextIncomeDate: '2026-10-13', today: '2026-10-13', mealPrice: null })).toEqual({
      status: 'passed',
    });
    expect(calculateIncomeCountdown({ balance: 1000, nextIncomeDate: null, today: '2026-10-13', mealPrice: null })).toBeNull();
  });

  it('flags discretionary spending above essentials and ignores other', () => {
    expect(
      calculateSocialScore([
        { category: 'social', amount: 300 },
        { category: 'food', amount: 200 },
        { category: 'other', amount: 1000 },
      ])
    ).toEqual({ essential: 200, discretionary: 300, ratio: 1.5, isDanger: true });
    expect(calculateSocialScore([{ category: 'other', amount: 10 }])).toBeNull();
  });

  it('builds an expense breakdown including other', () => {
    const r = getExpenseBreakdown([
      { category: 'food', amount: 300 },
      { category: 'other', amount: 100 },
      { category: 'legacy-unknown', amount: 100 },
    ]);
    expect(r.total).toBe(500);
    expect(r.slices).toEqual([
      { category: 'food', amount: 300, percent: 0.6 },
      { category: 'other', amount: 200, percent: 0.4 },
    ]);
  });
});

describe('analyzePayments', () => {
  const ctx = { currentBalance: 1000, averageDailyExpense: 0, nextIncomeDate: null, expectedIncomeAmount: null, today: '2026-10-13' };

  it('checks each payment against everything due up to its date', () => {
    const { items, overallLevel, totalDue } = analyzePayments(
      [
        { id: 'b', amount: 600, dueDate: '2026-10-15' },
        { id: 'a', amount: 600, dueDate: '2026-10-14' },
      ],
      ctx
    );
    expect(items.map((i) => [i.paymentId, i.amountNeeded, i.level])).toEqual([
      ['a', 600, 'none'],
      ['b', 1200, 'critical'],
    ]);
    expect(overallLevel).toBe('critical');
    expect(totalDue).toBe(1200);
  });

  it('accounts for spending trend and expected income', () => {
    const trend = { ...ctx, averageDailyExpense: 100 };
    expect(analyzePayments([{ id: 'x', amount: 500, dueDate: '2026-10-19' }], trend).items[0]).toMatchObject({
      daysUntilDue: 6,
      projectedBalanceOnDueDate: 400,
      level: 'high',
      reason: 'checkSpending',
    });
    const withIncome = { ...trend, nextIncomeDate: '2026-10-18', expectedIncomeAmount: 500 };
    expect(analyzePayments([{ id: 'x', amount: 500, dueDate: '2026-10-19' }], withIncome).items[0]!.level).toBe('medium');
  });
});
