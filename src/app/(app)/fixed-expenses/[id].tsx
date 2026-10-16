import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ConfirmButton } from '@/components/ui/confirm-button';
import { Screen, UNDER_HEADER_EDGES } from '@/components/ui/screen';
import { ErrorState, LoadingState } from '@/components/ui/state-views';
import { formatMoneyInput } from '@/core/money';
import { FixedExpenseForm } from '@/features/fixed-expenses/components/fixed-expense-form';
import {
  useDeleteFixedExpense,
  useFixedExpense,
  useUpdateFixedExpense,
} from '@/features/fixed-expenses/use-fixed-expenses';
import { useRegion } from '@/features/profile/use-region';
import { AppError } from '@/lib/app-error';

export default function EditFixedExpenseScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locale } = useRegion();
  const expense = useFixedExpense(id);
  const update = useUpdateFixedExpense();
  const remove = useDeleteFixedExpense();

  if (expense.isLoadingError) return <ErrorState error={expense.error} onRetry={() => expense.refetch()} />;
  if (expense.isPending) return <LoadingState />;
  if (!expense.data) return <ErrorState error={new AppError('notFound')} />;
  const e = expense.data;

  return (
    <Screen edges={UNDER_HEADER_EDGES}>
      <FixedExpenseForm
        defaultValues={{ name: e.name, amount: formatMoneyInput(e.amount, locale) }}
        onSubmit={async (input) => {
          await update.mutateAsync({ id: e.id, input });
          router.back();
        }}
      />
      <ConfirmButton
        title={t('fixedExpenses.delete')}
        confirmTitle={t('fixedExpenses.deleteTitle')}
        confirmMessage={t('fixedExpenses.deleteMessage')}
        onConfirm={async () => {
          await remove.mutateAsync(e.id);
          router.back();
        }}
      />
    </Screen>
  );
}
