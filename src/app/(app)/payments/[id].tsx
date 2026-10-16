import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { Button } from '@/components/ui/button';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { paymentSchema } from '@/core/schemas/planning';
import { formatYmd, ymdInZone } from '@/core/time';
import { PaymentCard } from '@/features/payments/components/payment-card';
import { PaymentForm } from '@/features/payments/components/payment-form';
import { useDeletePayment, usePayment, useUnpayPayment, useUpdatePayment } from '@/features/payments/use-payments';
import { useFormatMoney, useRegion } from '@/features/profile/use-region';
import { useTheme } from '@/hooks/use-theme';
import { AppError } from '@/lib/app-error';

/** Edit or pay an open payment; a paid one can only be undone or deleted. */
export default function PaymentScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const format = useFormatMoney();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeZone, locale } = useRegion();
  const payment = usePayment(id);
  const update = useUpdatePayment();
  const unpay = useUnpayPayment();
  const remove = useDeletePayment();

  if (payment.isError) return <ErrorState error={payment.error} onRetry={() => payment.refetch()} />;
  if (payment.isPending) return <LoadingState />;
  if (!payment.data) return <ErrorState error={new AppError('notFound')} />;
  const p = payment.data;

  const deleteButton = (
    <ConfirmButton
      title={t('payments.delete')}
      confirmTitle={t('payments.deleteTitle')}
      confirmMessage={t(p.isPaid ? 'payments.deletePaidMessage' : 'payments.deleteMessage')}
      onConfirm={async () => {
        await remove.mutateAsync(p.id);
        router.back();
      }}
    />
  );

  if (p.isPaid) {
    const paidOn = p.paidAt ? ymdInZone(p.paidAt, timeZone) : p.dueDate;
    return (
      <Screen edges={UNDER_HEADER_EDGES}>
        <PaymentCard payment={p}>
          <Text style={{ color: theme.textSecondary }}>
            {t('payments.paidNote', { date: formatYmd(paidOn, locale) })}
          </Text>
        </PaymentCard>
        <ConfirmButton
          variant="secondary"
          title={t('payments.unpay')}
          confirmTitle={t('payments.unpayTitle')}
          confirmMessage={t('payments.unpayMessage')}
          confirmLabel={t('payments.unpayConfirm')}
          onConfirm={() => unpay.mutateAsync(p.id)}
        />
        {deleteButton}
      </Screen>
    );
  }

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <Button
        title={`${t('payments.pay')} · ${format(p.amount)}`}
        onPress={() => router.push({ pathname: '/payments/pay/[id]', params: { id: p.id } })}
      />
      <PaymentForm
        schema={paymentSchema}
        defaultValues={{ name: p.name, amount: formatMoneyInput(p.amount, locale), dueDate: p.dueDate }}
        onSubmit={async (input) => {
          await update.mutateAsync({ id: p.id, input });
          router.back();
        }}
      />
      {deleteButton}
    </Screen>
  );
}

