import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import {
  FIXED_EXPENSE_NAME_MAX_LENGTH,
  fixedExpenseSchema,
  type FixedExpenseFormInput,
  type FixedExpenseInput,
} from '@/core/schemas/planning';
import { useRegion } from '@/features/profile/use-region';
import { useFormSubmit } from '@/hooks/use-form-submit';

type Props = {
  defaultValues: FixedExpenseFormInput;
  onSubmit: (values: FixedExpenseInput) => Promise<unknown>;
};

export function FixedExpenseForm({ defaultValues, onSubmit }: Props) {
  const { t } = useTranslation();
  const { currency } = useRegion();
  const { error, submit } = useFormSubmit(onSubmit);
  const { control, handleSubmit, formState } = useForm<FixedExpenseFormInput, unknown, FixedExpenseInput>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues,
  });

  return (
    <View style={styles.form}>
      <FormTextField
        control={control}
        name="name"
        label={t('fixedExpenses.name')}
        placeholder={t('fixedExpenses.namePlaceholder')}
        maxLength={FIXED_EXPENSE_NAME_MAX_LENGTH}
      />
      <FormTextField
        control={control}
        name="amount"
        label={`${t('fixedExpenses.amount')} (${currency})`}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
      />
      <FormMessage message={error} />
      <Button title={t('common.save')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
