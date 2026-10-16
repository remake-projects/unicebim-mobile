import { router } from 'expo-router';

import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { FixedExpenseForm } from '@/features/fixed-expenses/components/fixed-expense-form';
import { useCreateFixedExpense } from '@/features/fixed-expenses/use-fixed-expenses';

export default function NewFixedExpenseScreen() {
  const create = useCreateFixedExpense();
  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <FixedExpenseForm
        defaultValues={{ name: '', amount: '' }}
        onSubmit={async (values) => {
          await create.mutateAsync(values);
          router.back();
        }}
      />
    </Screen>
  );
}
