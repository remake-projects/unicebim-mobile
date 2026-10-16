import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = PropsWithChildren<{ label: string; error?: string; hint?: string }>;

/** Label, control, then an error or hint line, for controls that are not text fields. */
export function FieldGroup({ label, error, hint, children }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      {children}
      {error ? (
        <Text style={[styles.note, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  label: { fontSize: 14, fontWeight: 600 },
  note: { fontSize: 13 },
});
