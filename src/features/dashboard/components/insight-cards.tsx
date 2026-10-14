import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Spacing } from '@/constants/theme';
import type { Dashboard } from '@/core/dashboard';
import type { LimitLevel } from '@/core/insights';
import { useFormatMoney } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

function useLevelColor(): (level: LimitLevel) => string {
  const theme = useTheme();
  return (level) => (level === 'negative' ? theme.danger : level === 'ok' ? theme.success : theme.warning);
}

export function DailyLimitCard({ dashboard }: { dashboard: Dashboard }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const levelColor = useLevelColor();
  const { dailyBudget, dailyLimitLevel } = dashboard;
  return (
    <Card>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{t('insights.dailyLimit.title')}</Text>
      <Text style={[styles.big, { color: levelColor(dailyLimitLevel) }]}>{format(dailyBudget.dailyLimit)}</Text>
      <Text style={[styles.body, { color: theme.text }]}>{t(`insights.dailyLimit.${dailyLimitLevel}`)}</Text>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        {t('insights.dailyLimit.hint', { count: dailyBudget.remainingDays })}
      </Text>
    </Card>
  );
}

/** Meal index and income countdown side by side (each only when its setting exists). */
export function MealAndCountdownRow({ dashboard }: { dashboard: Dashboard }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const levelColor = useLevelColor();
  const { mealIndex, incomeCountdown } = dashboard;
  if (!mealIndex && !incomeCountdown) return null;

  return (
    <View style={styles.row}>
      {mealIndex ? (
        <Card style={styles.half}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{t('insights.mealIndex.title')}</Text>
          <Text style={[styles.medium, { color: theme.text }]}>
            {t('insights.mealIndex.value', { count: mealIndex.meals })}
          </Text>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{t('insights.mealIndex.hint')}</Text>
        </Card>
      ) : null}
      {incomeCountdown ? (
        <Card style={styles.half}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{t('insights.countdown.title')}</Text>
          {incomeCountdown.status === 'upcoming' ? (
            <>
              <Text style={[styles.medium, { color: levelColor(incomeCountdown.level) }]}>
                {t('insights.countdown.days', { count: incomeCountdown.daysRemaining })}
              </Text>
              <ProgressBar progress={1 - incomeCountdown.progress} />
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {t('insights.countdown.perDay', { amount: format(incomeCountdown.dailyLimit) })}
              </Text>
            </>
          ) : (
            <Text style={[styles.hint, { color: theme.textSecondary }]}>{t('insights.countdown.passed')}</Text>
          )}
        </Card>
      ) : null}
    </View>
  );
}

export function BudgetCard({ dashboard }: { dashboard: Dashboard }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const progress = dashboard.budgetProgress;
  if (!progress) return null;
  const over = progress.remaining < 0;
  return (
    <Card>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{t('insights.budget.title')}</Text>
      <Text style={[styles.body, { color: theme.text }]}>
        {t('insights.budget.spentOf', { spent: format(progress.spent), goal: format(progress.goal) })}
      </Text>
      <ProgressBar progress={progress.ratio} tone={over ? 'danger' : progress.ratio > 0.8 ? 'warning' : 'default'} />
      <Text style={[styles.hint, { color: over ? theme.danger : theme.textSecondary }]}>
        {over
          ? t('insights.budget.over', { amount: format(-progress.remaining) })
          : t('insights.budget.remaining', { amount: format(progress.remaining) })}
      </Text>
    </Card>
  );
}

export function SocialScoreCard({ dashboard }: { dashboard: Dashboard }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const score = dashboard.socialScore;
  if (!score) return null;
  const ratio = score.ratio ?? 1;
  return (
    <Card>
      <Text style={[styles.title, { color: theme.textSecondary }]}>{t('insights.socialScore.title')}</Text>
      <ProgressBar progress={Math.min(ratio, 1)} tone={score.isDanger ? 'danger' : ratio > 0.6 ? 'warning' : 'default'} />
      <Text style={[styles.body, { color: score.isDanger ? theme.danger : theme.text }]}>
        {score.isDanger
          ? t('insights.socialScore.danger')
          : t('insights.socialScore.ok', { percent: Math.round(ratio * 100) })}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 13, fontWeight: 600 },
  big: { fontSize: 32, fontWeight: 800, fontVariant: ['tabular-nums'] },
  medium: { fontSize: 22, fontWeight: 800 },
  body: { fontSize: 15, fontWeight: 500 },
  hint: { fontSize: 13 },
  row: { flexDirection: 'row', gap: Spacing.three },
  half: { flex: 1 },
});
