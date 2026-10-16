import { router, useLocalSearchParams } from 'expo-router';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { PayForm } from '@/features/payments/components/pay-form';
import { PaymentCard } from '@/features/payments/components/payment-card';
import { usePayment, usePayPayment } from '@/features/payments/use-payments';
import { useWallets } from '@/features/wallets/use-wallets';
import { AppError } from '@/lib/app-error';

export default function PayPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const payment = usePayment(id);
  const wallets = useWallets();
  const pay = usePayPayment();

  const failed = payment.isLoadingError ? payment : wallets.isLoadingError ? wallets : null;
  if (failed) return <ErrorState error={failed.error} onRetry={() => failed.refetch()} />;
  if (payment.isPending || !wallets.data) return <LoadingState />;
  if (!payment.data) return <ErrorState error={new AppError('notFound')} />;
  const p = payment.data;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <PaymentCard payment={p} />
      <PayForm
        wallets={wallets.data}
        onSubmit={async (input) => {
          await pay.mutateAsync({ id: p.id, input });
          router.dismiss(2); // closes this and the payment screen it was opened from
        }}
      />
    </Screen>
  );
}

