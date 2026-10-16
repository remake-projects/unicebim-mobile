import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SIZE = 36;

/** A service's logo, or its first letter when there is none or it fails to load. */
export function BrandLogo({ name, uri }: { name: string; uri: string | null }) {
  const theme = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);

  if (uri && uri !== failedUri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.box, { backgroundColor: theme.backgroundElement }]}
        contentFit="contain"
        cachePolicy="disk"
        accessibilityIgnoresInvertColors
        onError={() => setFailedUri(uri)}
      />
    );
  }
  return (
    <View style={[styles.box, styles.center, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.letter, { color: theme.textSecondary }]}>{name.trim().charAt(0).toLocaleUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: SIZE, height: SIZE, borderRadius: Radius.sm, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 16, fontWeight: 700 },
});
