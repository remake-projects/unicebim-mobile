import { StyleSheet, Text } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { message: string | null | undefined; tone?: 'error' | 'info' };

/** Form-level feedback (server errors, confirmations). Renders nothing without a message. */
export function FormMessage({ message, tone = 'error' }: Props) {
  const theme = useTheme();
  if (!message) return null;
  const color = tone === 'error' ? theme.danger : theme.success;
  return (
    <Text accessibilityLiveRegion="polite" style={[styles.box, { color, borderColor: color }]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.three, fontSize: 14 },
});
