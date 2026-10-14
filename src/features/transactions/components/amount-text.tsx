import { StyleSheet, Text, type TextStyle } from 'react-native';

import type { TransactionType } from '@/core/categories';
import { useFormatMoney } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';

type Props = { amount: number; type: TransactionType; neutral?: boolean; style?: TextStyle };

/** "+₺120" in green for income, "−₺45" for expenses; transfers stay neutral. */
export function AmountText({ amount, type, neutral = false, style }: Props) {
  const theme = useTheme();
  const format = useFormatMoney();
  const sign = type === 'income' ? '+' : '−';
  const color = neutral ? theme.textSecondary : type === 'income' ? theme.success : theme.text;
  return <Text style={[styles.amount, { color }, style]}>{`${sign}${format(Math.abs(amount))}`}</Text>;
}

const styles = StyleSheet.create({
  amount: { fontSize: 16, fontWeight: 700, fontVariant: ['tabular-nums'] },
});
