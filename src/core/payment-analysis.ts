import { daysBetween, type Ymd } from './time';

export type WarningLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/** Translatable reason; the UI renders it with daysUntilDue and amount. */
export type WarningReason =
  | 'cannotCoverToday'
  | 'insufficientBalance'
  | 'trendInsufficient'
  | 'checkSpending'
  | 'watchSpending'
  | 'reviewPlan'
  | 'upcoming';

export type PaymentAnalysisContext = {
  /** Money held across wallets right now. */
  currentBalance: number;
  averageDailyExpense: number;
  nextIncomeDate: Ymd | null;
  expectedIncomeAmount: number | null;
  today: Ymd;
};

export type AnalyzablePayment = { id: string; amount: number; dueDate: Ymd };

export type PaymentAnalysis = {
  paymentId: string;
  daysUntilDue: number;
  /** This payment plus every unpaid payment due on or before it. */
  amountNeeded: number;
  projectedBalanceOnDueDate: number;
  canCoverWithCurrentBalance: boolean;
  canCoverWithCurrentTrend: boolean;
  canCoverWithExpectedIncome: boolean;
  /** Daily spending that still leaves enough for the payments by the due date. */
  recommendedDailyLimit: number;
  level: WarningLevel;
  reason: WarningReason | null;
};

const LEVELS: readonly WarningLevel[] = ['none', 'low', 'medium', 'high', 'critical'];

/**
 * Analyze unpaid payments in due-date order. Unlike the web version, each payment is checked
 * against the cumulative amount due up to its date, so two payments cannot both "fit" into the
 * same balance.
 */
export function analyzePayments(
  payments: readonly AnalyzablePayment[],
  ctx: PaymentAnalysisContext
): { items: PaymentAnalysis[]; overallLevel: WarningLevel; totalDue: number } {
  const sorted = [...payments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  let cumulative = 0;
  const items = sorted.map((p) => {
    cumulative += p.amount;
    return analyzeOne(p, cumulative, ctx);
  });
  const overallLevel = items.reduce<WarningLevel>(
    (max, i) => (LEVELS.indexOf(i.level) > LEVELS.indexOf(max) ? i.level : max),
    'none'
  );
  return { items, overallLevel, totalDue: cumulative };
}

function analyzeOne(p: AnalyzablePayment, amountNeeded: number, ctx: PaymentAnalysisContext): PaymentAnalysis {
  const daysUntilDue = Math.max(0, daysBetween(ctx.today, p.dueDate));
  const projectedExpense = ctx.averageDailyExpense * daysUntilDue;
  const projectedBalanceOnDueDate = ctx.currentBalance - projectedExpense;

  const canCoverWithCurrentBalance = ctx.currentBalance >= amountNeeded;
  const canCoverWithCurrentTrend = projectedBalanceOnDueDate >= amountNeeded;
  const incomeArrivesInTime = ctx.nextIncomeDate != null && ctx.nextIncomeDate <= p.dueDate;
  const canCoverWithExpectedIncome =
    incomeArrivesInTime &&
    ctx.expectedIncomeAmount != null &&
    projectedBalanceOnDueDate + ctx.expectedIncomeAmount >= amountNeeded;

  const recommendedDailyLimit =
    daysUntilDue > 0 ? Math.max(0, (ctx.currentBalance - amountNeeded) / daysUntilDue) : 0;

  const covered = canCoverWithCurrentTrend || canCoverWithExpectedIncome;
  let level: WarningLevel = 'none';
  let reason: WarningReason | null = null;

  if (daysUntilDue === 0) {
    if (!canCoverWithCurrentBalance) [level, reason] = ['critical', 'cannotCoverToday'];
  } else if (daysUntilDue <= 3) {
    if (!canCoverWithCurrentBalance && !canCoverWithExpectedIncome) [level, reason] = ['critical', 'insufficientBalance'];
    else if (!canCoverWithCurrentTrend) [level, reason] = ['high', 'trendInsufficient'];
  } else if (daysUntilDue <= 7) {
    if (!covered) [level, reason] = ['high', 'checkSpending'];
    else if (projectedBalanceOnDueDate < amountNeeded * 1.1) [level, reason] = ['medium', 'watchSpending'];
  } else {
    if (!covered) [level, reason] = ['medium', 'reviewPlan'];
    else if (projectedBalanceOnDueDate < amountNeeded * 1.2) [level, reason] = ['low', 'upcoming'];
  }

  return {
    paymentId: p.id,
    daysUntilDue,
    amountNeeded,
    projectedBalanceOnDueDate,
    canCoverWithCurrentBalance,
    canCoverWithCurrentTrend,
    canCoverWithExpectedIncome,
    recommendedDailyLimit,
    level,
    reason,
  };
}
