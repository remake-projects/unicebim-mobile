import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BarSeries = { key: string; label: string; color: string };
export type BarGroup = {
  key: string;
  /** Axis label under the group; may be empty to keep dense charts readable. */
  label: string;
  /** One value per series, in series order. */
  values: readonly number[];
  /** What a screen reader announces for the group. */
  accessibilityLabel: string;
};

type Props = { series: readonly BarSeries[]; groups: readonly BarGroup[]; height?: number };

/** Vertical bars, grouped side by side per series; scaled to the largest value. Plain views, no SVG. */
export function BarChart({ series, groups, height = 140 }: Props) {
  const theme = useTheme();
  const max = Math.max(0, ...groups.flatMap((g) => g.values));

  return (
    <View style={styles.container}>
      {series.length > 1 ? (
        <View style={styles.legend}>
          {series.map((s) => (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.swatch, { backgroundColor: s.color }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={[styles.plot, { height, borderColor: theme.border }]}>
        {groups.map((g) => (
          <View key={g.key} accessible accessibilityLabel={g.accessibilityLabel} style={styles.group}>
            {g.values.map((v, i) => (
              <View
                key={series[i]?.key ?? i}
                style={[
                  styles.bar,
                  {
                    height: max > 0 ? `${(Math.max(0, v) / max) * 100}%` : 0,
                    backgroundColor: series[i]?.color ?? theme.primary,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {groups.map((g) => (
          <Text key={g.key} numberOfLines={1} style={[styles.label, { color: theme.textSecondary }]}>
            {g.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  legend: { flexDirection: 'row', gap: Spacing.three },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  swatch: { width: 10, height: 10, borderRadius: Radius.full },
  legendText: { fontSize: 12 },
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  group: { flex: 1, height: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 1 },
  bar: { flex: 1, maxWidth: 18, minHeight: 0, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  labels: { flexDirection: 'row', gap: 2 },
  label: { flex: 1, fontSize: 10, textAlign: 'center' },
});
