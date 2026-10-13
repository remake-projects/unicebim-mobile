import {
  DISCRETIONARY_EXPENSE_CATEGORIES,
  ESSENTIAL_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from './categories';
import { roundMoney } from './number';
import { daysBetween, type Ymd } from './time';

export type CategoryAmount = { category: string; amount: number };

/**
 * How healthy a per-day amount is. Measured in campus meals when the user set a meal price,
 * so the thresholds work in any currency; otherwise only the sign matters.
 */
export type LimitLevel = 'negative' | 'low' | 'medium' | 'ok';

export function dailyLimitLevel(dailyLimit: number, mealPrice: number | null): LimitLevel {
  if (dailyLimit < 0) return 'negative';
  if (mealPrice == null || !(mealPrice > 0)) return 'ok';
  if (dailyLimit < mealPrice) return 'low';
  if (dailyLimit < mealPrice * 2) return 'medium';
  return 'ok';
}

export type MealIndex = { meals: number; remainder: number };

/** "Yemekhane endeksi": how many campus meals a balance buys. */
export function calculateMealIndex(balance: number, mealPrice: number | null): MealIndex | null {
  if (mealPrice == null || !(mealPrice > 0)) return null;
  if (!(balance > 0)) return { meals: 0, remainder: 0 };
  const meals = Math.floor(balance / mealPrice);
  return { meals, remainder: roundMoney(balance - meals * mealPrice) };
}

export type IncomeCountdown =
  | { status: 'passed' }
  | {
      status: 'upcoming';
      daysRemaining: number;
      dailyLimit: number;
      level: LimitLevel;
      /** 0..1 — share of a 31-day cycle still left, for a progress bar. */
      progress: number;
    };

/** "Burs günü geri sayımı": days until the next income and a safe daily amount until then. */
export function calculateIncomeCountdown(input: {
  balance: number;
  nextIncomeDate: Ymd | null;
  today: Ymd;
  mealPrice: number | null;
}): IncomeCountdown | null {
  if (!input.nextIncomeDate) return null;
  const daysRemaining = daysBetween(input.today, input.nextIncomeDate);
  if (daysRemaining <= 0) return { status: 'passed' };
  const dailyLimit = roundMoney(input.balance / daysRemaining);
  return {
    status: 'upcoming',
    daysRemaining,
    dailyLimit,
    level: dailyLimitLevel(dailyLimit, input.mealPrice),
    progress: Math.min(daysRemaining / 31, 1),
  };
}

export type SocialScore = {
  essential: number;
  discretionary: number;
  /** discretionary / essential; null when there is no essential spending. */
  ratio: number | null;
  /** Discretionary spending exceeds essential spending. */
  isDanger: boolean;
};

/** "Sosyal skor vs. hayatta kalma". `other` spending is intentionally ignored. */
export function calculateSocialScore(expenses: readonly CategoryAmount[]): SocialScore | null {
  let essential = 0;
  let discretionary = 0;
  for (const e of expenses) {
    const amount = Math.max(0, Number.isFinite(e.amount) ? e.amount : 0);
    if ((ESSENTIAL_EXPENSE_CATEGORIES as readonly string[]).includes(e.category)) essential += amount;
    else if ((DISCRETIONARY_EXPENSE_CATEGORIES as readonly string[]).includes(e.category)) discretionary += amount;
  }
  if (essential === 0 && discretionary === 0) return null;
  return {
    essential: roundMoney(essential),
    discretionary: roundMoney(discretionary),
    ratio: essential > 0 ? discretionary / essential : null,
    isDanger: discretionary > essential,
  };
}

export type ExpenseSlice = { category: ExpenseCategory; amount: number; percent: number };

/** Expense totals per category with shares, largest first. Unknown categories fold into `other`. */
export function getExpenseBreakdown(expenses: readonly CategoryAmount[]): { total: number; slices: ExpenseSlice[] } {
  const totals = new Map<ExpenseCategory, number>();
  for (const e of expenses) {
    const amount = Math.max(0, Number.isFinite(e.amount) ? e.amount : 0);
    if (amount === 0) continue;
    const category = (EXPENSE_CATEGORIES as readonly string[]).includes(e.category)
      ? (e.category as ExpenseCategory)
      : 'other';
    totals.set(category, (totals.get(category) ?? 0) + amount);
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  if (total <= 0) return { total: 0, slices: [] };
  const slices = [...totals.entries()]
    .map(([category, amount]) => ({ category, amount: roundMoney(amount), percent: amount / total }))
    .sort((a, b) => b.amount - a.amount);
  return { total: roundMoney(total), slices };
}
