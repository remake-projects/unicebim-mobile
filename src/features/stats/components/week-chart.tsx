import { useTranslation } from 'react-i18next';

import { BarChart } from '@/components/charts/bar-chart';
import type { WeekdayComparison } from '@/core/stats';
import { addDays, formatYmd, type Ymd } from '@/core/time';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

/** Expenses per weekday, this week next to last week. `monday` is this week's Monday. */
export function WeekChart({ rows, monday }: { rows: readonly WeekdayComparison[]; monday: Ymd }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { locale } = useRegion();
  return (
    <BarChart
      series={[
        { key: 'previous', label: t('stats.lastWeek'), color: theme.backgroundSelected },
        { key: 'current', label: t('stats.thisWeek'), color: theme.primary },
      ]}
      groups={rows.map((r) => {
        const day = formatYmd(addDays(monday, r.weekday - 1), locale, { weekday: 'short' });
        return {
          key: String(r.weekday),
          label: day,
          values: [r.previous, r.current],
          accessibilityLabel: t('stats.weekBar', { day, current: format(r.current), previous: format(r.previous) }),
        };
      })}
    />
  );
}
