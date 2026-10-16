import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useIsOnline } from '@/lib/online';

/** Small pill under the status bar while there is no connection; cached data stays readable. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const online = useIsOnline();
  if (online) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + Spacing.one }]}>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[styles.pill, { backgroundColor: theme.primary, color: theme.onPrimary }]}>
        {t('offline.banner')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    overflow: 'hidden',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    fontSize: 12,
    fontWeight: 600,
  },
});
