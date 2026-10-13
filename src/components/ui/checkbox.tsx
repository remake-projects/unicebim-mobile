import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

export function Checkbox({ label, checked, onChange, error }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}>
        <View
          style={[
            styles.box,
            { borderColor: error ? theme.danger : theme.textSecondary, backgroundColor: checked ? theme.primary : 'transparent' },
          ]}>
          {checked ? <Text style={[styles.tick, { color: theme.onPrimary }]}>✓</Text> : null}
        </View>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44 },
  box: { width: 22, height: 22, borderRadius: Radius.sm / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tick: { fontSize: 14, fontWeight: 700 },
  label: { flex: 1, fontSize: 14 },
  error: { fontSize: 13 },
});
