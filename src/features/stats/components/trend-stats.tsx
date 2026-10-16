import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { summarizeTrend } from '@/core/stats';
import { useFormatMoney } from '@/features/profile/use-region';
import { useMonthlyTrends } from '@/features/transactions/use-transactions';
import { useTheme } from '@/hooks/use-theme';
import { StatCard } from './stat-card';
import { TrendChart } from './trend-chart';

export const TREND_MONTHS = 6;

export function TrendStats() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const trends = useMonthlyTrends(TREND_MONTHS);

  if (trends.isError) return <ErrorState error={trends.error} onRetry={() => trends.refetch()} />;
  if (!trends.data) return <LoadingState />;
  const summary = summarizeTrend(trends.data);
  const change = summary.expenseChangePercent;

  return (
    <>
      <View style={styles.row}>
        <Card style={styles.half}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('stats.averageIncome')}</Text>
          <Text style={[styles.value, { color: theme.success }]}>{format(summary.averageIncome)}</Text>
        </Card>
        <Card style={styles.half}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{t('stats.averageExpense')}</Text>
          <Text style={[styles.value, { color: theme.danger }]}>{format(summary.averageExpense)}</Text>
        </Card>
      </View>
      <StatCard title={t('stats.trendTitle')}>
        <TrendChart months={trends.data} />
        {change != null && Math.round(change) !== 0 ? (
          <Text style={{ color: theme.textSecondary }}>
            {t(change > 0 ? 'stats.changeUp' : 'stats.changeDown', { percent: Math.abs(Math.round(change)) })}
          </Text>
        ) : null}
      </StatCard>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  half: { flex: 1 },
  label: { fontSize: 13, fontWeight: 600 },
  value: { fontSize: 20, fontWeight: 700, fontVariant: ['tabular-nums'] },
});
