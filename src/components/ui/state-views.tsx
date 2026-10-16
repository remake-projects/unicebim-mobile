import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { Button } from './button';
import { IconTile, type IconName } from './icon';

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

type EmptyStateProps = {
  message: string;
  icon?: IconName;
  /** A way out of the empty state, e.g. "Add a payment". */
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      {icon ? <IconTile name={icon} size={56} /> : null}
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      {action ? <Button variant="secondary" title={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, padding: Spacing.four },
  message: { fontSize: 15, textAlign: 'center' },
});
