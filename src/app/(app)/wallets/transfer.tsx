import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/state-views';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { TransferForm } from '@/features/wallets/components/transfer-form';
import { useTransfer, useWallets } from '@/features/wallets/use-wallets';

/** Move money between two wallets; `from` preselects the source. */
export default function TransferScreen() {
  const { t } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { timeZone } = useRegion();
  const wallets = useWallets();
  const transfer = useTransfer();

  if (wallets.isError) return <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />;
  if (!wallets.data) return <LoadingState />;
  if (wallets.data.length < 2) return <EmptyState message={t('wallets.needTwoWallets')} />;

  const source = wallets.data.find((w) => w.id === from) ?? wallets.data[0]!;
  const target = wallets.data.find((w) => w.id !== source.id)!;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <TransferForm
        wallets={wallets.data}
        defaultValues={{ fromWalletId: source.id, toWalletId: target.id, amount: '', date: todayYmd(timeZone) }}
        onSubmit={async (values) => {
          await transfer.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}
