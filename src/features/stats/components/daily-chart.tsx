import { useTranslation } from 'react-i18next';

import { BarChart } from '@/components/charts/bar-chart';
import type { DayTotals } from '@/core/stats';
import { formatYmd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

/** Day numbers shown under the axis: 1, 5, 10, … keeps ~30 bars legible. */
const isLabelledDay = (day: number) => day === 1 || day % 5 === 0;

/** Expense per day of one month. */
export function DailyChart({ days }: { days: readonly DayTotals[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { locale } = useRegion();
  return (
    <BarChart
      series={[{ key: 'expense', label: t('summary.expense'), color: theme.danger }]}
      groups={days.map((d) => {
        const day = Number(d.date.slice(8, 10));
        return {
          key: d.date,
          label: isLabelledDay(day) ? String(day) : '',
          values: [d.expense],
          accessibilityLabel: t('stats.dailyBar', { date: formatYmd(d.date, locale), amount: format(d.expense) }),
        };
      })}
    />
  );
}
