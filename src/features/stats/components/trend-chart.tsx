import { useTranslation } from 'react-i18next';

import { BarChart } from '@/components/charts/bar-chart';
import type { MonthTotals } from '@/core/stats';
import { formatYearMonth, formatYmd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

/** Income and expense per month, oldest first. */
export function TrendChart({ months }: { months: readonly MonthTotals[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { locale } = useRegion();
  return (
    <BarChart
      series={[
        { key: 'income', label: t('summary.income'), color: theme.success },
        { key: 'expense', label: t('summary.expense'), color: theme.danger },
      ]}
      groups={months.map((m) => ({
        key: m.ym,
        label: formatYmd(`${m.ym}-01`, locale, { month: 'short' }),
        values: [m.income, m.expense],
        accessibilityLabel: t('stats.trendBar', {
          month: formatYearMonth(m.ym, locale),
          income: format(m.income),
          expense: format(m.expense),
        }),
      }))}
    />
  );
}
