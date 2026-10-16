import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Icon } from './icon';

type Tone = 'default' | 'danger' | 'warning' | 'success';

type Props = {
  title: string;
  subtitle?: string;
  subtitleTone?: Tone;
  /** Icon or logo before the text. */
  leading?: ReactNode;
  /** Right-aligned value, e.g. a balance. */
  detail?: string;
  onPress?: () => void;
  tone?: Tone;
};

/** Tappable list row with an optional subtitle and trailing detail. */
export function MenuRow({ title, subtitle, subtitleTone = 'default', leading, detail, onPress, tone = 'default' }: Props) {
  const theme = useTheme();
  const color = (t: Tone, fallback: string) => (t === 'default' ? fallback : theme[t]);
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: theme.border, opacity: pressed ? 0.7 : 1 }]}>
      {leading}
      <View style={styles.text}>
        <Text style={[styles.title, { color: color(tone, theme.text) }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: color(subtitleTone, theme.textSecondary) }]}>{subtitle}</Text> : null}
      </View>
      {detail ? <Text style={[styles.detail, { color: theme.text }]}>{detail}</Text> : null}
      {onPress ? <Icon name="chevronRight" color={theme.textSecondary} size={14} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 56,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: Spacing.half },
  title: { fontSize: 16, fontWeight: 500 },
  subtitle: { fontSize: 13 },
  detail: { fontSize: 16, fontWeight: 600, fontVariant: ['tabular-nums'] },
});
