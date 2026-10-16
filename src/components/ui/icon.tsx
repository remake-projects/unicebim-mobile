import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type PlatformSymbol = Required<Pick<Extract<SymbolViewProps['name'], object>, 'ios' | 'android'>>;

/** Every icon the app uses: SF Symbol on iOS, Material Symbol on Android. */
const ICONS = {
  add: { ios: 'plus', android: 'add' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  wallet: { ios: 'wallet.bifold', android: 'account_balance_wallet' },
  calendar: { ios: 'calendar', android: 'event' },
  repeat: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew' },
  pin: { ios: 'pin', android: 'push_pin' },
  target: { ios: 'target', android: 'track_changes' },
  import: { ios: 'square.and.arrow.down', android: 'download' },
  report: { ios: 'doc.text', android: 'description' },
  split: { ios: 'person.2', android: 'group' },
  person: { ios: 'person.crop.circle', android: 'account_circle' },
  key: { ios: 'key', android: 'key' },
  globe: { ios: 'globe', android: 'language' },
  lock: { ios: 'lock', android: 'lock' },
  receipt: { ios: 'list.bullet.rectangle', android: 'receipt_long' },
} as const satisfies Record<string, PlatformSymbol>;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; color: string; size?: number };

/** Native system icon; decorative, so screen readers skip it (the surrounding control is labelled). */
export function Icon({ name, color, size = 20 }: Props) {
  return (
    <SymbolView
      name={ICONS[name]}
      tintColor={color}
      size={size}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Icon on a soft rounded tile, used at the start of menu rows and in empty states. */
export function IconTile({ name, size = 36 }: { name: IconName; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size / 3.5, backgroundColor: theme.backgroundSelected },
      ]}>
      <Icon name={name} color={theme.text} size={size * 0.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
});
