import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { useRegion } from '@/features/profile/use-region';
import { WalletForm } from '@/features/wallets/components/wallet-form';
import { useDeleteWallet, useUpdateWallet, useWallet } from '@/features/wallets/use-wallets';
import { canDeleteWallet } from '@/features/wallets/wallets-api';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { AppError } from '@/lib/app-error';
import { confirmDestructive } from '@/lib/confirm';

export default function EditWalletScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useRegion();
  const wallet = useWallet(id);
  const update = useUpdateWallet();
  const remove = useDeleteWallet();

  if (wallet.isError) return <ErrorState error={wallet.error} onRetry={() => wallet.refetch()} />;
  if (wallet.isPending) return <LoadingState />;
  if (!wallet.data) return <ErrorState error={new AppError('notFound')} />;
  const w = wallet.data;

  async function onDelete() {
    const confirmed = await confirmDestructive({
      title: t('wallets.deleteTitle'),
      message: t('wallets.deleteMessage'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(w.id);
      router.dismissTo('/wallets');
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    }
  }

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <WalletForm
        defaultValues={{ name: w.name, balance: formatMoneyInput(w.balance, locale), isDefault: w.isDefault }}
        showDefaultToggle={false}
        submitLabel={t('common.save')}
        onSubmit={async (values) => {
          await update.mutateAsync({ id: w.id, name: values.name, balance: values.balance });
          router.back();
        }}
      />
      {canDeleteWallet(w) ? (
        <Button variant="ghost" title={t('wallets.delete')} loading={remove.isPending} onPress={onDelete} />
      ) : (
        <Text style={[styles.note, { color: theme.textSecondary }]}>
          {w.isDefault ? t('wallets.cannotDeleteDefault') : t('wallets.cannotDeleteBalance')}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, textAlign: 'center' },
});
