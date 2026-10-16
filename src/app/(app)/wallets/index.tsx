import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconTile } from '@/components/ui/icon';
import { MenuRow } from '@/components/ui/menu-row';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { Spacing } from '@/constants/theme';
import { roundMoney } from '@/core/number';
import { useFormatMoney } from '@/features/profile/use-region';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';

export default function WalletsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const wallets = useWallets();

  if (wallets.isLoadingError) return <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />;
  if (!wallets.data) return <LoadingState />;
  const total = roundMoney(wallets.data.reduce((sum, w) => sum + w.balance, 0));

  return (
    <Screen edges={UNDER_HEADER_EDGES} onRefresh={() => wallets.refetch()} refreshing={wallets.isRefetching}>
      <Card>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{t('wallets.total')}</Text>
        <Text style={[styles.total, { color: theme.text }]}>{format(total)}</Text>
      </Card>
      <View>
        {wallets.data.map((w) => (
          <MenuRow
            key={w.id}
            leading={<IconTile name="wallet" />}
            title={w.name}
            subtitle={w.isDefault ? t('wallets.isDefault') : undefined}
            detail={format(w.balance)}
            onPress={() => router.push({ pathname: '/wallets/[id]', params: { id: w.id } })}
          />
        ))}
      </View>
      <View style={styles.actions}>
        <Button title={t('wallets.new')} onPress={() => router.push('/wallets/new')} />
        {wallets.data.length > 1 ? (
          <Button variant="secondary" title={t('wallets.transfer')} onPress={() => router.push('/wallets/transfer')} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: 600 },
  total: { fontSize: 32, fontWeight: 800, fontVariant: ['tabular-nums'] },
  actions: { gap: Spacing.two },
});
