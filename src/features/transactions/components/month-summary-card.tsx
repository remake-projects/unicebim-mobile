import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import { useFormatMoney } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';
import type { MonthSummary } from '../transactions-api';

/** Income / expense / net of a month (transfers excluded). */
export function MonthSummaryCard({ summary }: { summary: MonthSummary | undefined }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const cells = [
    { label: t('summary.income'), value: summary?.incomeTotal, color: theme.success },
    { label: t('summary.expense'), value: summary?.expenseTotal, color: theme.text },
    {
      label: t('summary.net'),
      value: summary?.netTotal,
      color: (summary?.netTotal ?? 0) < 0 ? theme.danger : theme.text,
    },
  ];
  return (
    <Card style={styles.row}>
      {cells.map((cell) => (
        <View key={cell.label} style={styles.cell}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{cell.label}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: cell.color }]}>
            {cell.value == null ? '—' : format(cell.value)}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  cell: { flex: 1, gap: Spacing.half },
  label: { fontSize: 13 },
  value: { fontSize: 16, fontWeight: 700, fontVariant: ['tabular-nums'] },
});
