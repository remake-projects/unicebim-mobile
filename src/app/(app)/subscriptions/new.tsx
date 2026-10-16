import { router } from 'expo-router';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { renewalAfter } from '@/core/subscriptions';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { SubscriptionForm } from '@/features/subscriptions/components/subscription-form';
import { useCreateSubscription } from '@/features/subscriptions/use-subscriptions';

export default function NewSubscriptionScreen() {
  const { timeZone } = useRegion();
  const create = useCreateSubscription();
  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <SubscriptionForm
        defaultValues={{
          name: '',
          amount: '',
          billingCycle: 'monthly',
          nextRenewalDate: renewalAfter(todayYmd(timeZone), 'monthly'),
          isActive: true,
        }}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}
