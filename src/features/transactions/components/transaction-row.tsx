import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { categoryEmoji } from '../category-meta';
import type { Transaction } from '../transactions-api';
import { useCategoryLabel } from '../use-category-label';
import { AmountText } from './amount-text';

type Props = {
  transaction: Transaction;
  walletName: string | null;
  onPress: (transaction: Transaction) => void;
};

export function TransactionRow({ transaction: tx, walletName, onPress }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const categoryLabel = useCategoryLabel();
  const category = categoryLabel(tx.category);
  const title = tx.description ?? category;
  const subtitle = [tx.description ? category : null, walletName ?? t('transactions.noWallet')]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(tx)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.icon, { backgroundColor: theme.backgroundElement }]}>
        <Text style={styles.emoji}>{categoryEmoji(tx.category)}</Text>
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
          {title}
        </Text>
        <Text numberOfLines={1} style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <AmountText amount={tx.amount} type={tx.type} neutral={tx.isTransfer} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 60, paddingVertical: Spacing.two },
  icon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  text: { flex: 1, gap: Spacing.half },
  title: { fontSize: 16, fontWeight: 600 },
  subtitle: { fontSize: 13 },
});
