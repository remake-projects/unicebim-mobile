import { StyleSheet, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = { progress: number; tone?: 'default' | 'warning' | 'danger' };

/** Horizontal bar; `progress` is clamped to 0..1. */
export function ProgressBar({ progress, tone = 'default' }: Props) {
  const theme = useTheme();
  const fill = tone === 'danger' ? theme.danger : tone === 'warning' ? theme.warning : theme.primary;
  const ratio = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fill }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
});
