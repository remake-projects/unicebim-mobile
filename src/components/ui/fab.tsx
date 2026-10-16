import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Icon } from './icon';

export const FAB_SIZE = 56;

type Props = { onPress: () => void; accessibilityLabel: string };

/**
 * Floating "+" button above screen content. The native tab bar cannot host a custom
 * center button, so screens that add things render this instead.
 */
export function Fab({ onPress, accessibilityLabel }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor: theme.primary, bottom: insets.bottom + Spacing.three, opacity: pressed ? 0.85 : 1 },
      ]}>
      <Icon name="add" color={theme.onPrimary} size={28} />
    </Pressable>
  );
}

/** Bottom padding for scroll content so the last row is not hidden under the button. */
export const FAB_CLEARANCE = FAB_SIZE + Spacing.four * 2;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
