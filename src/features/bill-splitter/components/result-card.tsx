import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';

export type ResultLine = { label: string; value: string; emphasis?: boolean };

/** Label/value lines; emphasized lines are the answer the user is looking for. */
export function ResultCard({ lines }: { lines: readonly ResultLine[] }) {
  const theme = useTheme();
  return (
    <Card>
      {lines.map((line) => (
        <View key={line.label} style={styles.row}>
          <Text style={[line.emphasis ? styles.strongLabel : null, { color: line.emphasis ? theme.text : theme.textSecondary }]}>
            {line.label}
          </Text>
          <Text style={[styles.value, line.emphasis && styles.strongValue, { color: theme.text }]}>{line.value}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  strongLabel: { fontWeight: 700 },
  value: { fontSize: 16, fontWeight: 600, fontVariant: ['tabular-nums'] },
  strongValue: { fontSize: 22, fontWeight: 800 },
});
