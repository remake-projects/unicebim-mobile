import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { ConfirmButton } from '@/components/ui/confirm-button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { useRegion } from '@/features/profile/use-region';
import { WalletForm } from '@/features/wallets/components/wallet-form';
import { useDeleteWallet, useUpdateWallet, useWallet } from '@/features/wallets/use-wallets';
import { canDeleteWallet } from '@/features/wallets/wallets-api';
import { useTheme } from '@/hooks/use-theme';
import { AppError } from '@/lib/app-error';

export default function EditWalletScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useRegion();
  const wallet = useWallet(id);
  const update = useUpdateWallet();
  const remove = useDeleteWallet();

  if (wallet.isLoadingError) return <ErrorState error={wallet.error} onRetry={() => wallet.refetch()} />;
  if (wallet.isPending) return <LoadingState />;
  if (!wallet.data) return <ErrorState error={new AppError('notFound')} />;
  const w = wallet.data;

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
        <ConfirmButton
          title={t('wallets.delete')}
          confirmTitle={t('wallets.deleteTitle')}
          confirmMessage={t('wallets.deleteMessage')}
          onConfirm={async () => {
            await remove.mutateAsync(w.id);
            router.dismissTo('/wallets');
          }}
        />
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
