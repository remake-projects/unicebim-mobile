import { zodResolver } from '@hookform/resolvers/zod';
import { useController, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldGroup } from '@/components/ui/field-group';
import { FormDateField } from '@/components/ui/form-date-field';
import { FormMessage } from '@/components/ui/form-message';
import { FormTextField } from '@/components/ui/form-text-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Spacing } from '@/constants/theme';
import {
  PLAN_NAME_MAX_LENGTH,
  subscriptionSchema,
  type SubscriptionFormInput,
  type SubscriptionInput,
} from '@/core/schemas/planning';
import { BILLING_CYCLES } from '@/core/subscriptions';
import { todayYmd } from '@/core/time';
import { useRegion } from '@/features/profile/use-region';
import { useFormSubmit } from '@/hooks/use-form-submit';

type Props = {
  defaultValues: SubscriptionFormInput;
  onSubmit: (values: SubscriptionInput) => Promise<unknown>;
};

export function SubscriptionForm({ defaultValues, onSubmit }: Props) {
  const { t } = useTranslation();
  const { timeZone, locale, currency } = useRegion();
  const { error, submit } = useFormSubmit(onSubmit);
  const { control, handleSubmit, formState } = useForm<SubscriptionFormInput, unknown, SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues,
  });
  const cycle = useController({ control, name: 'billingCycle' });
  const active = useController({ control, name: 'isActive' });

  return (
    <View style={styles.form}>
      <FormTextField
        control={control}
        name="name"
        label={t('subscriptions.name')}
        placeholder={t('subscriptions.namePlaceholder')}
        maxLength={PLAN_NAME_MAX_LENGTH}
      />
      <FormTextField
        control={control}
        name="amount"
        label={`${t('subscriptions.amount')} (${currency})`}
        keyboardType="decimal-pad"
        inputMode="decimal"
        placeholder="0"
      />
      <FieldGroup label={t('subscriptions.billing')}>
        <SegmentedControl
          options={BILLING_CYCLES.map((c) => ({ value: c, label: t(`subscriptions.cycle.${c}`) }))}
          value={cycle.field.value}
          onChange={cycle.field.onChange}
          accessibilityLabel={t('subscriptions.billing')}
        />
      </FieldGroup>
      <FormDateField
        control={control}
        name="nextRenewalDate"
        label={t('subscriptions.nextRenewal')}
        initialDate={todayYmd(timeZone)}
        locale={locale}
      />
      <Checkbox label={t('subscriptions.active')} checked={!!active.field.value} onChange={active.field.onChange} />
      <FormMessage message={error} />
      <Button title={t('common.save')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
