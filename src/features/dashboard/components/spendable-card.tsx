import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Spacing } from '@/constants/theme';
import type { Spendable } from '@/core/budget';
import { useFormatMoney } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

export function SpendableCard({ spendable }: { spendable: Spendable }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  return (
    <Card style={{ backgroundColor: theme.primary }}>
      <Text style={[styles.label, { color: theme.onPrimary }]}>{t('home.spendable')}</Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.amount, { color: spendable.spendable < 0 ? theme.danger : theme.onPrimary }]}>
        {format(spendable.spendable)}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.detail, { color: theme.onPrimary }]}>
          {t('home.walletTotal')}: {format(spendable.walletTotal)}
        </Text>
        {spendable.reserved > 0 ? (
          <Text style={[styles.detail, { color: theme.onPrimary }]}>
            {t('home.reserved')}: {format(spendable.reserved)}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: 600, opacity: 0.8 },
  amount: { fontSize: 40, fontWeight: 800, fontVariant: ['tabular-nums'] },
  row: { gap: Spacing.half },
  detail: { fontSize: 13, opacity: 0.8 },
});
