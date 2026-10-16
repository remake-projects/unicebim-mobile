import { StyleSheet, Switch, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/** A setting with an on/off switch and an explanation below the label. */
export function SwitchRow({ label, hint, value, onValueChange, disabled }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderColor: theme.border }]}>
      <View style={styles.text}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: theme.textSecondary }]}>{hint}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: Spacing.half },
  label: { fontSize: 16, fontWeight: 500 },
  hint: { fontSize: 13, lineHeight: 18 },
});
