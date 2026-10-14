import { Pressable, StyleSheet, Text, View } from 'react-native';

import { categoriesFor, type TransactionType } from '@/core/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { categoryEmoji } from '../category-meta';
import { useCategoryLabel } from '../use-category-label';

type Props = {
  type: TransactionType;
  value: string;
  onChange: (category: string) => void;
  error?: string;
};

/** Grid of large category tiles for the given transaction type. */
export function CategoryPicker({ type, value, onChange, error }: Props) {
  const theme = useTheme();
  const label = useCategoryLabel();
  return (
    <View style={styles.container}>
      <View accessibilityRole="radiogroup" style={styles.grid}>
        {categoriesFor(type).map((category) => {
          const selected = category === value;
          return (
            <Pressable
              key={category}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={label(category)}
              onPress={() => onChange(category)}
              style={[
                styles.tile,
                {
                  backgroundColor: selected ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: selected ? theme.primary : error ? theme.danger : 'transparent',
                },
              ]}>
              <Text style={styles.emoji}>{categoryEmoji(category)}</Text>
              <Text numberOfLines={2} style={[styles.label, { color: theme.text }]}>
                {label(category)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    width: '31%',
    flexGrow: 1,
    minHeight: 76,
    borderRadius: Radius.md,
    borderWidth: 2,
    padding: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  emoji: { fontSize: 24 },
  label: { fontSize: 12, fontWeight: 600, textAlign: 'center' },
  error: { fontSize: 13 },
});
