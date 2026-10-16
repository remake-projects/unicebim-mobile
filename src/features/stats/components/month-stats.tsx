import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { dailyTotals, fillMonthDays, weekOverWeekExpenses } from '@/core/stats';
import { addDays, currentYearMonth, monthRange, startOfDayInstant, startOfIsoWeek, todayYmd, type YearMonth } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { MonthSummaryCard } from '@/features/transactions/components/month-summary-card';
import { RANGE_MAX_ROWS } from '@/features/transactions/transactions-api';
import {
  useExpenseCategoryTotals,
  useMonthSummary,
  useRangeTransactions,
} from '@/features/transactions/use-transactions';
import { useTheme } from '@/hooks/use-theme';
import { CategoryBreakdown } from './category-breakdown';
import { DailyChart } from './daily-chart';
import { StatCard } from './stat-card';
import { WeekChart } from './week-chart';

/** Summary, category shares and daily spending of one month (plus a week comparison for this month). */
export function MonthStats({ ym }: { ym: YearMonth }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const isCurrent = ym === currentYearMonth(timeZone);
  const monday = startOfIsoWeek(today);

  const summary = useMonthSummary(ym);
  const categories = useExpenseCategoryTotals(ym);
  const month = useRangeTransactions(monthRange(ym, timeZone));
  // Last week can reach into the previous month, so it is its own range.
  const weeks = useRangeTransactions({
    start: startOfDayInstant(addDays(monday, -7), timeZone),
    end: startOfDayInstant(addDays(today, 1), timeZone),
  });

  const queries = [summary, categories, month, ...(isCurrent ? [weeks] : [])];
  const failed = queries.find((q) => q.isError);
  if (failed) return <ErrorState error={failed.error} onRetry={() => queries.forEach((q) => q.isError && q.refetch())} />;
  if (!summary.data || !categories.data || !month.data || (isCurrent && !weeks.data)) return <LoadingState />;

  return (
    <>
      <MonthSummaryCard summary={summary.data} />
      <StatCard title={t('stats.categories')}>
        <CategoryBreakdown totals={categories.data} />
      </StatCard>
      <StatCard title={t('stats.daily')}>
        <DailyChart days={fillMonthDays(dailyTotals(month.data.items, timeZone), ym)} />
        {month.data.truncated ? (
          <Text style={{ color: theme.textSecondary }}>{t('stats.truncated', { count: RANGE_MAX_ROWS })}</Text>
        ) : null}
      </StatCard>
      {isCurrent && weeks.data ? (
        <StatCard title={t('stats.week')}>
          <WeekChart rows={weekOverWeekExpenses(weeks.data.items, today, timeZone)} monday={monday} />
        </StatCard>
      ) : null}
    </>
  );
}
