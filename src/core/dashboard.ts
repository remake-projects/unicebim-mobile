import {
  calculateBudgetProgress,
  calculateDailyBudget,
  calculateSpendable,
  type BudgetProgress,
  type DailyBudget,
  type Spendable,
} from './budget';
import {
  calculateIncomeCountdown,
  calculateMealIndex,
  calculateSocialScore,
  dailyLimitLevel,
  type CategoryAmount,
  type IncomeCountdown,
  type LimitLevel,
  type MealIndex,
  type SocialScore,
} from './insights';
import type { Ymd } from './time';

export type DashboardInput = {
  today: Ymd;
  walletBalances: readonly number[];
  unpaidPaymentAmounts: readonly number[];
  month: { incomeTotal: number; expenseTotal: number; fixedExpensesPaid: number };
  expenseByCategory: readonly CategoryAmount[];
  profile: {
    monthlyBudgetGoal: number | null;
    monthlyFixedExpenses: number | null;
    mealPrice: number | null;
    nextIncomeDate: Ymd | null;
  };
};

export type Dashboard = {
  spendable: Spendable;
  dailyBudget: DailyBudget;
  dailyLimitLevel: LimitLevel;
  /** Meals the spendable balance buys; null without a meal price. */
  mealIndex: MealIndex | null;
  incomeCountdown: IncomeCountdown | null;
  socialScore: SocialScore | null;
  budgetProgress: BudgetProgress | null;
};

/**
 * Everything the home screen shows, derived from raw query results.
 * Spendable = money in wallets − unpaid upcoming payments (decision in docs §8.1).
 */
export function buildDashboard(input: DashboardInput): Dashboard {
  const { profile, today } = input;
  const spendable = calculateSpendable(input);
  const dailyBudget = calculateDailyBudget({
    spendable: spendable.spendable,
    plannedFixedExpenses: profile.monthlyFixedExpenses ?? 0,
    fixedExpensesPaid: input.month.fixedExpensesPaid,
    today,
  });

  return {
    spendable,
    dailyBudget,
    dailyLimitLevel: dailyLimitLevel(dailyBudget.dailyLimit, profile.mealPrice),
    mealIndex: calculateMealIndex(spendable.spendable, profile.mealPrice),
    incomeCountdown: calculateIncomeCountdown({
      balance: Math.max(0, spendable.spendable),
      nextIncomeDate: profile.nextIncomeDate,
      today,
      mealPrice: profile.mealPrice,
    }),
    socialScore: calculateSocialScore(input.expenseByCategory),
    budgetProgress: calculateBudgetProgress(profile.monthlyBudgetGoal, input.month.expenseTotal),
  };
}
