import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { ymdInZone } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { AmountText } from '@/features/transactions/components/amount-text';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import type { Transaction } from '@/features/transactions/transactions-api';
import { useDeleteTransaction, useTransaction, useUpdateTransaction } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage } from '@/i18n/messages';
import { confirmDestructive } from '@/lib/confirm';

export default function EditTransactionScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeZone, locale } = useRegion();
  const transaction = useTransaction(id);
  const wallets = useWallets();
  const update = useUpdateTransaction(transaction.data);
  const remove = useDeleteTransaction();

  const failed = transaction.isError ? transaction : wallets.isError ? wallets : null;
  if (failed) return <ErrorState error={failed.error} onRetry={() => failed.refetch()} />;
  if (!transaction.data || !wallets.data) return <LoadingState />;
  const tx = transaction.data;

  async function onDelete(target: Transaction) {
    const confirmed = await confirmDestructive({
      title: t(target.isTransfer ? 'transactions.deleteTransferTitle' : 'transactions.deleteTitle'),
      message: t(target.isTransfer ? 'transactions.deleteTransferMessage' : 'transactions.deleteMessage'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(target);
      router.back();
    } catch (error) {
      Alert.alert(errorMessage(t, error));
    }
  }

  const deleteButton = (
    <Button variant="ghost" title={t('common.delete')} loading={remove.isPending} onPress={() => onDelete(tx)} />
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
