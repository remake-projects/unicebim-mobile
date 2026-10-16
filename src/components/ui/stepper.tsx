import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  decreaseLabel: string;
  increaseLabel: string;
};

/** − value + control for small whole numbers. */
export function Stepper({ value, onChange, min, max, decreaseLabel, increaseLabel }: Props) {
  const theme = useTheme();
  const button = (label: string, symbol: string, next: number, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onChange(next)}
      style={[styles.button, { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.4 : 1 }]}>
      <Text style={[styles.symbol, { color: theme.text }]}>{symbol}</Text>
    </Pressable>
  );
  return (
    <View accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }} style={styles.row}>
      {button(decreaseLabel, '−', value - 1, value <= min)}
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      {button(increaseLabel, '+', value + 1, value >= max)}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  button: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  symbol: { fontSize: 22, fontWeight: 600 },
  value: { minWidth: 32, textAlign: 'center', fontSize: 20, fontWeight: 700, fontVariant: ['tabular-nums'] },
});
