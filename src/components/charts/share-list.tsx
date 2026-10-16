import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ProgressBar } from '../ui/progress-bar';

export type ShareItem = {
  key: string;
  label: string;
  leading?: ReactNode;
  /** Formatted amount. */
  value: string;
  /** Share of the total, 0..1. */
  ratio: number;
};

/** Ranked rows with a bar for each item's share of the total (replaces a pie chart). */
export function ShareList({ items }: { items: readonly ShareItem[] }) {
  const theme = useTheme();
  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item.key} style={styles.item}>
          <View style={styles.row}>
            {item.leading}
            <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>{item.value}</Text>
            <Text style={[styles.percent, { color: theme.textSecondary }]}>{Math.round(item.ratio * 100)}%</Text>
          </View>
          <ProgressBar progress={item.ratio} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  item: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { flex: 1, fontSize: 15 },
  value: { fontSize: 15, fontWeight: 600, fontVariant: ['tabular-nums'] },
  percent: { width: 40, textAlign: 'right', fontSize: 13, fontVariant: ['tabular-nums'] },
});
