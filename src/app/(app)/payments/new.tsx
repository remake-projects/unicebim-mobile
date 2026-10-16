import { router } from 'expo-router';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { makePaymentSchema } from '@/core/schemas/planning';
import { todayYmd } from '@/core/time';
import { PaymentForm } from '@/features/payments/components/payment-form';
import { useCreatePayment } from '@/features/payments/use-payments';
import { useRegion } from '@/features/profile/use-region';

export default function NewPaymentScreen() {
  const { timeZone } = useRegion();
  const today = todayYmd(timeZone);
  const create = useCreatePayment();
  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <PaymentForm
        schema={makePaymentSchema(today)}
        defaultValues={{ name: '', amount: '', dueDate: today }}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}
