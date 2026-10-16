import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Fab, FAB_CLEARANCE } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { needsOnboarding } from '@/core/budget';
import { currentYearMonth } from '@/core/time';
import {
  BudgetCard,
  DailyLimitCard,
  MealAndCountdownRow,
  SocialScoreCard,
} from '@/features/dashboard/components/insight-cards';
import { SpendableCard } from '@/features/dashboard/components/spendable-card';
import { RenewingSubscriptions, UpcomingPayments } from '@/features/dashboard/components/upcoming-sections';
import { WalletStrip } from '@/features/dashboard/components/wallet-strip';
import { useDashboard } from '@/features/dashboard/use-dashboard';
import { OnboardingForm } from '@/features/profile/components/onboarding-form';
import { useProfile } from '@/features/profile/use-profile';
import { useRegion } from '@/features/profile/use-region';
import { MonthSummaryCard } from '@/features/transactions/components/month-summary-card';
import { openTransaction } from '@/features/transactions/components/transaction-list';
import { TransactionRow } from '@/features/transactions/components/transaction-row';
import { useMonthSummary, useRecentTransactions } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';
import { invalidateLedger, queryKeys } from '@/lib/query-keys';

export default function HomeScreen() {
  const profile = useProfile();
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => profile.refetch()} />;
  if (!profile.data) return <LoadingState />;
  if (needsOnboarding(profile.data)) {
    return (
      <Screen>
        <OnboardingForm />
      </Screen>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const { t } = useTranslation();
  const client = useQueryClient();
  const { timeZone } = useRegion();
  const state = useDashboard();
  const wallets = useWallets();
  const summary = useMonthSummary(currentYearMonth(timeZone));
  const recent = useRecentTransactions();
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.all([
        invalidateLedger(client),
        client.invalidateQueries({ queryKey: queryKeys.profile }),
        client.invalidateQueries({ queryKey: queryKeys.payments }),
        client.invalidateQueries({ queryKey: queryKeys.subscriptions }),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  if (state.status === 'error') return <ErrorState error={state.error} onRetry={state.retry} />;
  if (state.status === 'loading') return <LoadingState />;
  const { dashboard } = state;
  const walletNames = new Map(wallets.data?.map((w) => [w.id, w.name]));

  return (
    <View style={styles.flex}>
      <Screen bottomInset={FAB_CLEARANCE} onRefresh={refresh} refreshing={refreshing}>
        <SpendableCard spendable={dashboard.spendable} />
        <DailyLimitCard dashboard={dashboard} />
        <MealAndCountdownRow dashboard={dashboard} />
        <BudgetCard dashboard={dashboard} />
        <SocialScoreCard dashboard={dashboard} />

        <UpcomingPayments />
        <RenewingSubscriptions />

        <SectionHeader title={t('wallets.title')} actionLabel={t('common.seeAll')} onAction={() => router.push('/wallets')} />
        <WalletStrip wallets={wallets.data ?? []} />

        <SectionHeader title={t('home.thisMonth')} />
        <MonthSummaryCard summary={summary.data} />

        <SectionHeader
          title={t('home.recent')}
          actionLabel={t('common.seeAll')}
          onAction={() => router.navigate('/transactions')}
        />
        {recent.data?.length ? (
          <View>
            {recent.data.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                walletName={tx.walletId ? (walletNames.get(tx.walletId) ?? null) : null}
                onPress={openTransaction}
              />
            ))}
          </View>
        ) : (
          <EmptyState message={t('home.recentEmpty')} />
        )}
      </Screen>
      <Fab accessibilityLabel={t('transactions.add')} onPress={() => router.push('/transaction/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
