import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { Button } from './button';

export function LoadingState() {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.textSecondary} />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{errorMessage(t, error)}</Text>
      {onRetry ? <Button variant="secondary" title={t('common.retry')} onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  message: { fontSize: 15, textAlign: 'center' },
});
