import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Spacing } from '@/constants/theme';
import { onboardingSchema, type OnboardingFormInput, type OnboardingInput } from '@/core/schemas/profile';
import { useFormSubmit } from '@/hooks/use-form-submit';
import { useTheme } from '@/hooks/use-theme';
import { useUpdateBudgetSettings } from '../use-profile';
import { BudgetSettingsFields } from './budget-settings-fields';

/** First run on the home screen: the budget goal unlocks the dashboard. */
export function OnboardingForm() {
  const { t } = useTranslation();
  const theme = useTheme();
  const update = useUpdateBudgetSettings();
  // The profile cache update swaps in the dashboard.
  const { error, submit } = useFormSubmit((values: OnboardingInput) => update.mutateAsync(values));
  const { control, handleSubmit, formState } = useForm<OnboardingFormInput, unknown, OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { monthlyBudgetGoal: '', nextIncomeDate: '', mealPrice: '' },
  });

  return (
    <View style={styles.form}>
      <Text style={[styles.title, { color: theme.text }]}>{t('onboarding.title')}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{t('onboarding.subtitle')}</Text>
      <BudgetSettingsFields control={control} />
      <FormMessage message={error} />
      <Button title={t('onboarding.submit')} loading={formState.isSubmitting} onPress={handleSubmit(submit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  title: { fontSize: 28, fontWeight: 800 },
  subtitle: { fontSize: 15, lineHeight: 22 },
});
