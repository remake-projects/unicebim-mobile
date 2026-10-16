import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Fab, FAB_CLEARANCE } from '@/components/ui/fab';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { roundMoney } from '@/core/number';
import { todayYmd } from '@/core/time';
import { PaymentRow } from '@/features/payments/components/payment-row';
import { usePaymentAnalyses, usePayments } from '@/features/payments/use-payments';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

export default function PaymentsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const payments = usePayments();
  const analyses = usePaymentAnalyses();

  if (payments.isError) return <ErrorState error={payments.error} onRetry={() => payments.refetch()} />;
  if (!payments.data) return <LoadingState />;
  const unpaid = payments.data.filter((p) => !p.isPaid);
  const paid = payments.data.filter((p) => p.isPaid);
  const total = roundMoney(unpaid.reduce((sum, p) => sum + p.amount, 0));

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Screen
        edges={UNDER_HEADER_EDGES}
        bottomInset={FAB_CLEARANCE}
        onRefresh={() => payments.refetch()}
        refreshing={payments.isRefetching}>
        {payments.data.length === 0 ? (
          <EmptyState message={t('payments.empty')} />
        ) : (
          <>
            <Card>
              <Text style={[styles.label, { color: theme.textSecondary }]}>{t('payments.unpaidTotal')}</Text>
              <Text style={[styles.total, { color: theme.text }]}>{format(total)}</Text>
            </Card>
            {unpaid.length ? (
              <View>
                {unpaid.map((p) => (
                  <PaymentRow key={p.id} payment={p} analysis={analyses?.get(p.id)} today={today} />
                ))}
              </View>
            ) : null}
            {paid.length ? (
              <>
                <SectionHeader title={t('payments.paid')} />
                <View>
                  {paid.map((p) => (
                    <PaymentRow key={p.id} payment={p} analysis={undefined} today={today} />
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </Screen>
      <Fab accessibilityLabel={t('payments.new')} onPress={() => router.push('/payments/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 13, fontWeight: 600 },
  total: { fontSize: 32, fontWeight: 800, fontVariant: ['tabular-nums'] },
});
