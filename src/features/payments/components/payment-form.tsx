import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { FormDateField } from '@/components/ui/form-date-field';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { Spacing } from '@/constants/theme';
import { PLAN_NAME_MAX_LENGTH, type PaymentFormInput, type PaymentInput } from '@/core/schemas/planning';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { useFormSubmit } from '@/hooks/use-form-submit';

type Props = {
  /** makePaymentSchema(today) for new payments, paymentSchema when editing. */
  schema: z.ZodType<PaymentInput, PaymentFormInput>;
  defaultValues: PaymentFormInput;
  onSubmit: (values: PaymentInput) => Promise<unknown>;
};

export function PaymentForm({ schema, defaultValues, onSubmit }: Props) {
  const { t } = useTranslation();
  const { timeZone, locale, currency } = useRegion();
  const { error, submit } = useFormSubmit(onSubmit);
  const { control, handleSubmit, formState } = useForm<PaymentFormInput, unknown, PaymentInput>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <View style={styles.form}>
      <FormTextField
        control={control}
        name="name"
        label={t('payments.name')}
        placeholder={t('payments.namePlaceholder')}
        maxLength={PLAN_NAME_MAX_LENGTH}
      />
      <FormTextField
        control={control}
        name="amount"
        label={`${t('transactions.amount')} (${currency})`}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
      />
      <FormDateField
        control={control}
        name="dueDate"
        label={t('payments.dueDate')}
        initialDate={todayYmd(timeZone)}
        locale={locale}
      />
      <FormMessage message={error} />
      <Button title={t('common.save')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
