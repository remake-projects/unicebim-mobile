import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useFormatMoney } from '@/features/profile/use-region';
import type { Wallet } from '@/features/wallets/wallets-api';
import { useTheme } from '@/hooks/use-theme';

/** Horizontally scrolling wallet balances; tapping one opens its detail. */
export function WalletStrip({ wallets }: { wallets: readonly Wallet[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {wallets.map((w) => (
        <Pressable
          key={w.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/wallets/[id]', params: { id: w.id } })}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text numberOfLines={1} style={[styles.name, { color: theme.textSecondary }]}>
            {w.name}
            {w.isDefault ? ` · ${t('wallets.isDefault')}` : ''}
          </Text>
          <Text numberOfLines={1} style={[styles.balance, { color: theme.text }]}>
            {format(w.balance)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two },
  card: { minWidth: 140, borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.one },
  name: { fontSize: 13, fontWeight: 600 },
  balance: { fontSize: 18, fontWeight: 700, fontVariant: ['tabular-nums'] },
});
