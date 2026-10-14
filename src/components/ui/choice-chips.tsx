import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Option } from './segmented-control';

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

/** Horizontally scrolling single-choice chips for longer option lists (wallets, filters). */
export function ChoiceChips<T extends string>({ options, value, onChange, accessibilityLabel }: Props<T>) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? theme.primary : theme.backgroundElement,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}>
            <Text style={[styles.label, { color: selected ? theme.onPrimary : theme.text }]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.two, paddingVertical: Spacing.half },
  chip: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: 600 },
});
