import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { expenseByCategory, reportTotals } from '@/core/report';
import { addDays, startOfDayInstant, todayYmd, type Ymd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { buildReportCsv } from '@/features/report/report-csv';
import { CategoryBreakdown } from '@/features/stats/components/category-breakdown';
import { StatCard } from '@/features/stats/components/stat-card';
import { RANGE_MAX_ROWS } from '@/features/transactions/transactions-api';
import { useCategoryLabel } from '@/features/transactions/use-category-label';
import { useRangeTransactions } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { shareTextFile } from '@/lib/share-file';

type TypeFilter = 'all' | 'income' | 'expense';

export default function ReportScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const categoryLabel = useCategoryLabel();
  const { timeZone, locale, currency } = useRegion();
  const today = todayYmd(timeZone);
  const [from, setFrom] = useState<Ymd>(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState<Ymd>(today);
  const [type, setType] = useState<TypeFilter>('all');
  const [sharing, setSharing] = useState(false);
  const wallets = useWallets();
  const report = useRangeTransactions(
    { start: startOfDayInstant(from, timeZone), end: startOfDayInstant(addDays(to, 1), timeZone) },
    type === 'all' ? null : type
  );

  async function share() {
    if (!report.data) return;
    setSharing(true);
    try {
      const csv = buildReportCsv(report.data.items, {
        t,
        categoryLabel,
        walletNames: new Map(wallets.data?.map((w) => [w.id, w.name])),
        timeZone,
        currency,
      });
      await shareTextFile(`unicebim-${from}_${to}.csv`, csv, {
        mimeType: 'text/csv',
        uti: 'public.comma-separated-values-text',
        dialogTitle: t('report.shareTitle'),
      });
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    } finally {
      setSharing(false);
    }
  }

  const totals = report.data ? reportTotals(report.data.items) : null;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <View style={styles.dates}>
        <View style={styles.date}>
          <DateField
            label={t('report.from')}
            value={from}
            onChange={setFrom}
            initialDate={from}
            maximumDate={to}
            locale={locale}
          />
        </View>
        <View style={styles.date}>
          <DateField
            label={t('report.to')}
            value={to}
            onChange={setTo}
            initialDate={to}
            minimumDate={from}
            maximumDate={today}
            locale={locale}
          />
        </View>
      </View>
      <SegmentedControl
        options={[
          { value: 'all', label: t('common.all') },
          { value: 'income', label: t('transactions.type.income') },
          { value: 'expense', label: t('transactions.type.expense') },
        ]}
        value={type}
        onChange={setType}
      />

      {report.isLoadingError ? (
        <ErrorState error={report.error} onRetry={() => report.refetch()} />
      ) : !report.data || !totals ? (
        <LoadingState />
      ) : (
        <>
          <Card>
            <Text style={[styles.count, { color: theme.textSecondary }]}>
              {totals.count ? t('report.count', { count: totals.count }) : t('report.empty')}
            </Text>
            <Row label={t('summary.income')} value={format(totals.income)} color={theme.success} />
            <Row label={t('summary.expense')} value={format(totals.expense)} color={theme.danger} />
            <Row label={t('summary.net')} value={format(totals.net)} color={theme.text} />
            {report.data.truncated ? (
              <Text style={{ color: theme.textSecondary }}>{t('stats.truncated', { count: RANGE_MAX_ROWS })}</Text>
            ) : null}
          </Card>
          {totals.expense > 0 ? (
            <StatCard title={t('stats.categories')}>
              <CategoryBreakdown totals={expenseByCategory(report.data.items)} />
            </StatCard>
          ) : null}
          <Button title={t('report.share')} loading={sharing} disabled={!totals.count} onPress={share} />
        </>
      )}
    </Screen>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.textSecondary }}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dates: { flexDirection: 'row', gap: Spacing.three },
  date: { flex: 1 },
  count: { fontSize: 13, fontWeight: 600 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { fontSize: 16, fontWeight: 700, fontVariant: ['tabular-nums'] },
});
