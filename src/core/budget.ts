import { roundMoney } from './number';
import { remainingDaysInMonth, type Ymd } from './time';

export type SpendableInput = {
  walletBalances: readonly number[];
  /** All unpaid upcoming payments (overdue ones are still owed). */
  unpaidPaymentAmounts: readonly number[];
};

export type Spendable = {
  /** Money the user actually holds across wallets. */
  walletTotal: number;
  /** Money already promised to upcoming payments. */
  reserved: number;
  /** walletTotal − reserved; negative means upcoming payments cannot be covered. */
  spendable: number;
};

/** "Harcanabilir bakiye": wallet balances minus unpaid upcoming payments. */
export function calculateSpendable({ walletBalances, unpaidPaymentAmounts }: SpendableInput): Spendable {
  const walletTotal = roundMoney(sum(walletBalances));
  const reserved = roundMoney(sum(unpaidPaymentAmounts));
  return { walletTotal, reserved, spendable: roundMoney(walletTotal - reserved) };
}

export type DailyBudgetInput = {
  spendable: number;
  /** Sum of the user's planned monthly fixed expenses (profile). */
  plannedFixedExpenses: number;
  /** Fixed-expense category spending already recorded this month. */
  fixedExpensesPaid: number;
  today: Ymd;
};

export type DailyBudget = {
  remainingDays: number;
  remainingFixedExpenses: number;
  /** "Bugün ne kadar harcayabilirim?" — may be negative. */
  dailyLimit: number;
};

export function calculateDailyBudget(input: DailyBudgetInput): DailyBudget {
  const remainingDays = remainingDaysInMonth(input.today);
  const remainingFixedExpenses = Math.max(0, finite(input.plannedFixedExpenses) - finite(input.fixedExpensesPaid));
  const dailyLimit = (finite(input.spendable) - remainingFixedExpenses) / remainingDays;
  return { remainingDays, remainingFixedExpenses: roundMoney(remainingFixedExpenses), dailyLimit: roundMoney(dailyLimit) };
}

export type BudgetProgress = { goal: number; spent: number; remaining: number; ratio: number };

export function calculateBudgetProgress(goal: number | null, monthExpenseTotal: number): BudgetProgress | null {
  if (goal == null || !(goal > 0)) return null;
  const spent = finite(monthExpenseTotal);
  return { goal, spent, remaining: roundMoney(goal - spent), ratio: spent / goal };
}

/** Users without a monthly budget goal see the onboarding flow first. */
export function needsOnboarding(profile: { monthlyBudgetGoal: number | null }): boolean {
  return !(profile.monthlyBudgetGoal != null && profile.monthlyBudgetGoal > 0);
}

/** Average spending per elapsed day of the current month. */
export function averageDailyExpense(monthExpenseTotal: number, today: Ymd): number {
  const dayOfMonth = Number(today.slice(8, 10));
  return finite(monthExpenseTotal) / Math.max(1, dayOfMonth);
}

function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + finite(v), 0);
}

function finite(n: number): number {
  return Number.isFinite(n) ? n : 0;
}
