import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui/card';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { ymdInZone } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { AmountText } from '@/features/transactions/components/amount-text';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';

export default function EditTransactionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeZone, locale } = useRegion();
  const transaction = useTransaction(id);
  const wallets = useWallets();
  const update = useUpdateTransaction(transaction.data);
  const remove = useDeleteTransaction();

  const failed = transaction.isLoadingError ? transaction : wallets.isLoadingError ? wallets : null;
  if (failed) return <ErrorState error={failed.error} onRetry={() => failed.refetch()} />;
  if (!transaction.data || !wallets.data) return <LoadingState />;
  const tx = transaction.data;

  const deleteButton = (
    <ConfirmButton
      title={t('common.delete')}
      confirmTitle={t(tx.isTransfer ? 'transactions.deleteTransferTitle' : 'transactions.deleteTitle')}
      confirmMessage={t(tx.isTransfer ? 'transactions.deleteTransferMessage' : 'transactions.deleteMessage')}
      onConfirm={async () => {
        await remove.mutateAsync(tx);
        router.back();
      }}
    />
  );

  if (tx.isTransfer) {
    return (
      <Screen edges={UNDER_HEADER_EDGES}>
        <Stack.Screen options={{ title: t('categories.transfer') }} />
        <Card>
          <AmountText amount={tx.amount} type={tx.type} neutral style={styles.amount} />
          <Text style={{ color: theme.textSecondary }}>{tx.description}</Text>
          <Text style={{ color: theme.text }}>{t('transactions.transferNote')}</Text>
        </Card>
        {deleteButton}
      </Screen>
    );
  }

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <TransactionForm
        wallets={wallets.data}
        defaultValues={{
          type: tx.type,
          amount: formatMoneyInput(tx.amount, locale),
          category: tx.category,
          date: ymdInZone(tx.date, timeZone),
          description: tx.description ?? '',
          walletId: tx.walletId,
        }}
        submitLabel={t('common.save')}
        onSubmit={async (values) => {
          await update.mutateAsync({ id: tx.id, ...values });
          router.back();
        }}
      />
      {deleteButton}
    </Screen>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: 28 },
});
