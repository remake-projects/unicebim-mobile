import { buildDashboard, type Dashboard } from '@/core/dashboard';
import { currentYearMonth, todayYmd } from '@/core/time';
import { useUnpaidPaymentAmounts } from '@/features/payments/use-payments';
import { useProfile } from '@/features/profile/use-profile';
import { useRegion } from '@/features/profile/use-region';
import { useExpenseCategoryTotals, useMonthSummary } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; error: unknown; retry: () => void }
  | { status: 'ready'; dashboard: Dashboard };

/** Home screen numbers for the current month, derived from the cached queries. */
export function useDashboard(): DashboardState {
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const ym = currentYearMonth(timeZone);

  const profile = useProfile();
  const wallets = useWallets();
  const payments = useUnpaidPaymentAmounts();
  const summary = useMonthSummary(ym);
  const categories = useExpenseCategoryTotals(ym);
  const queries = [profile, wallets, payments, summary, categories];

  const failed = queries.find((q) => q.isError);
  if (failed) {
    return {
      status: 'error',
      error: failed.error,
      retry: () => queries.forEach((q) => q.isError && q.refetch()),
    };
  }
  if (!profile.data || !wallets.data || !payments.data || !summary.data || !categories.data) {
    return { status: 'loading' };
  }

  return {
    status: 'ready',
    dashboard: buildDashboard({
      today,
      walletBalances: wallets.data.map((w) => w.balance),
      unpaidPaymentAmounts: payments.data,
      month: summary.data,
      expenseByCategory: categories.data,
      profile: profile.data,
    }),
  };
}
