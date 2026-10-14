import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addMonths, formatYearMonth, type YearMonth } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

type Props = { value: YearMonth; onChange: (ym: YearMonth) => void; max: YearMonth };

/** "‹ October 2026 ›"; cannot move past `max` (the current month). */
export function MonthSwitcher({ value, onChange, max }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { locale } = useRegion();
  const canGoNext = value < max;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('transactions.previousMonth')}
        onPress={() => onChange(addMonths(value, -1))}
        hitSlop={12}
        style={styles.arrow}>
        <Text style={[styles.arrowText, { color: theme.text }]}>‹</Text>
      </Pressable>
      <Text accessibilityRole="header" style={[styles.label, { color: theme.text }]}>
        {formatYearMonth(value, locale)}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('transactions.nextMonth')}
        accessibilityState={{ disabled: !canGoNext }}
        disabled={!canGoNext}
        onPress={() => onChange(addMonths(value, 1))}
        hitSlop={12}
        style={[styles.arrow, !canGoNext && styles.disabled]}>
        <Text style={[styles.arrowText, { color: theme.text }]}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, fontWeight: 500 },
  label: { fontSize: 18, fontWeight: 700, textTransform: 'capitalize' },
  disabled: { opacity: 0.3 },
});
