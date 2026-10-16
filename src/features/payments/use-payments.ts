import { useQuery } from '@tanstack/react-query';

import { averageDailyExpense } from '@/core/budget';
import { analyzePayments, type PaymentAnalysis } from '@/core/payment-analysis';
import type { PaymentInput, PayPaymentInput } from '@/core/schemas/planning';
import { currentYearMonth, todayYmd } from '@/core/time';
import { useUserId } from '@/features/auth/auth-provider';
import { useProfile } from '@/features/profile/use-profile';
import { useRegion } from '@/features/profile/use-region';
import { useMonthSummary } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';
import { queryKeys } from '@/lib/query-keys';
import { useInvalidatingMutation } from '@/lib/use-invalidating-mutation';
import {
  createPayment,
  deletePayment,
  fetchPayments,
  payPayment,
  unpayPayment,
  updatePayment,
  type Payment,
} from './payments-api';

export function usePayments() {
  return useQuery({ queryKey: queryKeys.payments, queryFn: () => fetchPayments() });
}

/** One payment from the cached list. */
export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: () => fetchPayments(),
    select: (payments: Payment[]) => payments.find((p) => p.id === id) ?? null,
  });
}

/** What is still owed; the home screen reserves it from the wallets. */
export function useUnpaidPaymentAmounts() {
  return useQuery({
    queryKey: queryKeys.payments,
    queryFn: () => fetchPayments(),
    select: (payments: Payment[]) => payments.filter((p) => !p.isPaid).map((p) => p.amount),
  });
}

/**
 * Whether each unpaid payment can be covered, given the wallets, this month's spending pace and
 * the next income date. Null until all inputs are loaded.
 */
export function usePaymentAnalyses(): ReadonlyMap<string, PaymentAnalysis> | null {
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const payments = usePayments();
  const wallets = useWallets();
  const summary = useMonthSummary(currentYearMonth(timeZone));
  const profile = useProfile();
  if (!payments.data || !wallets.data || !summary.data || !profile.data) return null;

  const { items } = analyzePayments(
    payments.data.filter((p) => !p.isPaid),
    {
      currentBalance: wallets.data.reduce((sum, w) => sum + w.balance, 0),
      averageDailyExpense: averageDailyExpense(summary.data.expenseTotal, today),
      nextIncomeDate: profile.data.nextIncomeDate,
      expectedIncomeAmount: null,
      today,
    }
  );
  return new Map(items.map((a) => [a.paymentId, a]));
}

export function useCreatePayment() {
  const userId = useUserId();
  return useInvalidatingMutation((input: PaymentInput) => createPayment(userId, input), [queryKeys.payments]);
}

export function useUpdatePayment() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: PaymentInput }) => updatePayment(id, input),
    [queryKeys.payments]
  );
}

export function useDeletePayment() {
  return useInvalidatingMutation((id: string) => deletePayment(id), [queryKeys.payments]);
}

/** Paying adds (or undoing removes) an expense, so balances and ledger views change too. */
const PAY_KEYS = [queryKeys.payments, queryKeys.ledger, queryKeys.wallets];

export function usePayPayment() {
  const { timeZone } = useRegion();
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: PayPaymentInput }) => payPayment(id, input, timeZone),
    PAY_KEYS
  );
}

export function useUnpayPayment() {
  return useInvalidatingMutation((id: string) => unpayPayment(id), PAY_KEYS);
}
