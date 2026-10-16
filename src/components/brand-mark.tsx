import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { Radius } from '@/constants/theme';

// `require` rather than an import: the image module types live in the generated expo-env.d.ts,
// which is not committed, so CI would not see them.
const icon = require('../../assets/images/icon.png');

/** The app icon, shown at the top of the sign-in and sign-up screens. */
export function BrandMark({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={icon}
      style={[styles.mark, { width: size, height: size }]}
      accessibilityIgnoresInvertColors
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  mark: { borderRadius: Radius.lg, alignSelf: 'center' },
});
