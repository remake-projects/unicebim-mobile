import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Spacing } from '@/constants/theme';
import { formatMoneyInput } from '@/core/money';
import { onboardingSchema, type OnboardingFormInput, type OnboardingInput } from '@/core/schemas/profile';
import { useFormSubmit } from '@/hooks/use-form-submit';
import type { Profile } from '../profile-api';
import { useRegion } from '../use-region';
import { BudgetSettingsFields } from './budget-settings-fields';

type Props = { profile: Profile; onSubmit: (values: OnboardingInput) => Promise<unknown> };

export function BudgetSettingsForm({ profile, onSubmit }: Props) {
  const { t } = useTranslation();
  const { locale } = useRegion();
  const { error, submit } = useFormSubmit(onSubmit);
  const money = (value: number | null) => (value == null ? '' : formatMoneyInput(value, locale));
  const { control, handleSubmit, formState } = useForm<OnboardingFormInput, unknown, OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      monthlyBudgetGoal: money(profile.monthlyBudgetGoal),
      nextIncomeDate: profile.nextIncomeDate ?? '',
      mealPrice: money(profile.mealPrice),
    },
  });

  return (
    <View style={styles.form}>
      <BudgetSettingsFields control={control} />
      <FormMessage message={error} />
      <Button title={t('common.save')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
});
