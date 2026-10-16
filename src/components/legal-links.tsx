import { openBrowserAsync } from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { env } from '@/lib/env';

/** Privacy policy and terms links (each only when its URL is configured). */
export function LegalLinks() {
  const { t } = useTranslation();
  const theme = useTheme();
  const links = [
    { url: env.privacyPolicyUrl, label: t('legal.privacy') },
    { url: env.termsUrl, label: t('legal.terms') },
  ].filter((l): l is { url: string; label: string } => !!l.url);
  if (!links.length) return null;

  return (
    <View style={styles.row}>
      {links.map((l) => (
        <Pressable key={l.url} accessibilityRole="link" hitSlop={8} onPress={() => void openBrowserAsync(l.url)}>
          <Text style={[styles.link, { color: theme.textSecondary }]}>{l.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.four },
  link: { fontSize: 13, textDecorationLine: 'underline' },
});
