import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Fab, FAB_CLEARANCE } from '@/components/ui/fab';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { monthlySubscriptionsTotal } from '@/core/subscriptions';
import { todayYmd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { SubscriptionRow } from '@/features/subscriptions/components/subscription-row';
import { useSubscriptions } from '@/features/subscriptions/use-subscriptions';
import { useTheme } from '@/hooks/use-theme';

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const subscriptions = useSubscriptions();

  if (subscriptions.isLoadingError) return <ErrorState error={subscriptions.error} onRetry={() => subscriptions.refetch()} />;
  if (!subscriptions.data) return <LoadingState />;
  const monthly = monthlySubscriptionsTotal(subscriptions.data);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Screen
        edges={UNDER_HEADER_EDGES}
        bottomInset={FAB_CLEARANCE}
        onRefresh={() => subscriptions.refetch()}
        refreshing={subscriptions.isRefetching}>
        {subscriptions.data.length === 0 ? (
          <EmptyState message={t('subscriptions.empty')} />
        ) : (
          <>
            <Card>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t('subscriptions.monthlyTotal')}</Text>
              <Text style={[styles.total, { color: theme.text }]}>{format(monthly)}</Text>
              <Text style={{ color: theme.textSecondary }}>
                {t('subscriptions.yearlyTotal', { amount: format(monthly * 12) })}
              </Text>
            </Card>
            <View>
              {subscriptions.data.map((s) => (
                <SubscriptionRow key={s.id} subscription={s} today={today} />
              ))}
            </View>
          </>
        )}
      </Screen>
      <Fab accessibilityLabel={t('subscriptions.new')} onPress={() => router.push('/subscriptions/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 13, fontWeight: 600 },
  total: { fontSize: 32, fontWeight: 800, fontVariant: ['tabular-nums'] },
});
