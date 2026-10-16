import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Props = { uri: string | null; name: string | null; size?: number };

function initials(name: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toLocaleUpperCase())
    .join('');
}

/** Round profile picture, or the person's initials without one. */
export function Avatar({ uri, name, size = 56 }: Props) {
  const theme = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.backgroundElement };
  if (uri) {
    return <Image source={{ uri }} style={shape} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[shape, styles.center]}>
      <Text style={[styles.initials, { color: theme.textSecondary, fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: 700 },
});
