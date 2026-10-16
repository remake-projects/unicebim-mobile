import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ConfirmButton } from '@/components/ui/confirm-button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { nextRenewalOnOrAfter } from '@/core/subscriptions';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { SubscriptionForm } from '@/features/subscriptions/components/subscription-form';
import {
  useDeleteSubscription,
  useSubscription,
  useUpdateSubscription,
} from '@/features/subscriptions/use-subscriptions';
import { AppError } from '@/lib/app-error';

export default function EditSubscriptionScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeZone, locale } = useRegion();
  const subscription = useSubscription(id);
  const update = useUpdateSubscription();
  const remove = useDeleteSubscription();

  if (subscription.isLoadingError) return <ErrorState error={subscription.error} onRetry={() => subscription.refetch()} />;
  if (subscription.isPending) return <LoadingState />;
  if (!subscription.data) return <ErrorState error={new AppError('notFound')} />;
  const s = subscription.data;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <SubscriptionForm
        defaultValues={{
          name: s.name,
          amount: formatMoneyInput(s.amount, locale),
          billingCycle: s.billingCycle,
          // A passed date is shown (and saved) as the upcoming renewal.
          nextRenewalDate: nextRenewalOnOrAfter(s.nextRenewalDate, s.billingCycle, todayYmd(timeZone)),
          isActive: s.isActive,
        }}
        onSubmit={async (input) => {
          await update.mutateAsync({ id: s.id, input });
          router.back();
        }}
      />
      <ConfirmButton
        title={t('subscriptions.delete')}
        confirmTitle={t('subscriptions.deleteTitle')}
        confirmMessage={t('subscriptions.deleteMessage')}
        onConfirm={async () => {
          await remove.mutateAsync(s.id);
          router.back();
        }}
      />
    </Screen>
  );
}
