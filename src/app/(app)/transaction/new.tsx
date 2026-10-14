import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { TransactionForm } from '@/features/transactions/components/transaction-form';
import { useCreateTransaction } from '@/features/transactions/use-transactions';
import { useWallets } from '@/features/wallets/use-wallets';

/** Add a transaction; `walletId` preselects a wallet (from the wallet screen). */
export default function NewTransactionScreen() {
  const { t } = useTranslation();
  const { walletId } = useLocalSearchParams<{ walletId?: string }>();
  const { timeZone } = useRegion();
  const wallets = useWallets();
  const create = useCreateTransaction();

  if (wallets.isError) return <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />;
  if (!wallets.data) return <LoadingState />;

  const preselected = wallets.data.find((w) => w.id === walletId) ?? wallets.data.find((w) => w.isDefault);

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <TransactionForm
        wallets={wallets.data}
        defaultValues={{
          type: 'expense',
          amount: '',
          category: '',
          date: todayYmd(timeZone),
          description: '',
          walletId: preselected?.id ?? wallets.data[0]?.id ?? null,
        }}
        submitLabel={t('common.save')}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}
